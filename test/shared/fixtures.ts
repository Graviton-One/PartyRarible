import { ethers, waffle, upgrades } from "hardhat"
import { BigNumber } from "ethers"

import { Fixture } from "ethereum-waffle"
import {
  eth,
  tokenID1,
  tokenID2,
  tokenID3,
  orderToStruct,
  SimpleOrder,
} from "./utilities"

import { IWETH } from "../../typechain/IWETH"
import { TestERC721 } from "../../typechain/TestERC721"
import { ERC721VaultFactory } from "../../typechain/ERC721VaultFactory"

import { LibOrderTest } from "../../typechain/LibOrderTest"
import { TransferProxyTest } from "../../typechain/TransferProxyTest"
import { ERC20TransferProxyTest } from "../../typechain/ERC20TransferProxyTest"
import { ExchangeV2 } from "../../typechain/ExchangeV2"

import { PartyRarible } from "../../typechain/PartyRarible"

import {
  toAddress,
  toBigNumber,
  toBinary,
  randomWord,
  ZERO_ADDRESS,
  toWord,
} from "@rarible/types"

interface TokensFixture {
  weth: IWETH
  nftContract: TestERC721
}

export const tokensFixture: Fixture<TokensFixture> = async function (
  [wallet, other, artistSigner],
  provider
): Promise<TokensFixture> {
  // Deploy WETH
  const wethFactory = await ethers.getContractFactory("WETH")
  const weth = (await wethFactory.deploy()) as IWETH

  // For other exchanges, deploy the test NFT Contract
  const nftFactory = await ethers.getContractFactory("TestERC721")
  const nftContract = (await nftFactory.deploy()) as TestERC721

  // Mint token to artist
  await nftContract.mint(artistSigner.address, tokenID1)
  await nftContract.mint(artistSigner.address, tokenID2)

  return {
    weth,
    nftContract,
  }
}

interface FractionsFixture {
  settings: Settings
  vaultFactory: ERC721VaultFactory
}

export const fractionsFixture: Fixture<FractionsFixture> = async function (
  [wallet, other, artistSigner],
  provider
): Promise<FractionsFixture> {
  const settingsFactory = await ethers.getContractFactory("Settings")
  const settings = (await settingsFactory.deploy()) as Settings

  const vaultFactoryFactory = await ethers.getContractFactory(
    "ERC721VaultFactory"
  )
  const vaultFactory = (await vaultFactoryFactory.deploy(
    settings.address
  )) as ERC721VaultFactory

  return {
    settings,
    vaultFactory,
  }
}

interface ExchangeFixture extends TokensFixture {
  exchange: ExchangeV2
}

export const exchangeFixture: Fixture<ExchangeFixture> = async function (
  [wallet, other, artistSigner],
  provider
): Promise<ExchangeFixture> {
  const { weth, nftContract } = await tokensFixture(
    [wallet, other, artistSigner],
    provider
  )

  console.log(1)
  const libOrderFactory = await ethers.getContractFactory("LibOrderTest")
  const libOrder = (await libOrderFactory.deploy()) as LibOrderTest
  const transferProxyFactory = await ethers.getContractFactory(
    "TransferProxyTest"
  )
  const transferProxy =
    (await transferProxyFactory.deploy()) as TransferProxyTest
  const erc20TransferProxyTestFactory = await ethers.getContractFactory(
    "ERC20TransferProxyTest"
  )
  const erc20TransferProxy =
    (await erc20TransferProxyTestFactory.deploy()) as ERC20TransferProxyTest

  console.log(2)
  const exchangeFactory = await ethers.getContractFactory("ExchangeSimpleV2")
  const exchange = (await upgrades.deployProxy(
    exchangeFactory,
    [transferProxy.address, erc20TransferProxy.address],
    { initializer: "__ExchangeSimpleV2_init" }
  )) as ExchangeV2

  console.log(3)
  // Approve NFT Transfer to Foundation Exchange
  await nftContract.connect(artistSigner).approve(exchange.address, tokenID1)

  const reservePrice = eth("10")
  // place order
  const left: SimpleOrder = {
    make: {
      assetType: {
        assetClass: "ERC721",
        contract: toAddress(nftContract.address),
        tokenId: toBigNumber("1"),
      },
      value: toBigNumber("5"),
    },
    maker: toAddress(artistSigner.address),
    take: {
      assetType: {
        assetClass: "ERC20",
        contract: toAddress(weth.address),
      },
      value: toBigNumber("10"),
    },
    salt: randomWord(),
    type: "RARIBLE_V2",
    data: {
      dataType: "RARIBLE_V2_DATA_V1",
      payouts: [],
      originFees: [],
    },
  }

  console.log(4)
  await exchange.upsertOrder(orderToStruct(left))
  return {
    weth,
    nftContract,
    exchange,
  }
}
