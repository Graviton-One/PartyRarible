import { ethers, waffle, upgrades, web3 } from "hardhat"
import { BigNumber } from "ethers"

import { Fixture } from "ethereum-waffle"
import {
  eth,
  tokenID1,
  tokenID2,
  tokenID3,
  orderToStruct,
  SimpleOrder,
  signOrder,
} from "./utilities"

import { IWETH } from "../../typechain/IWETH"
import { TestERC721 } from "../../typechain/TestERC721"
import { Settings } from "../../typechain/Settings"
import { ERC721VaultFactory } from "../../typechain/ERC721VaultFactory"

import { LibOrderTest } from "../../typechain/LibOrderTest"
import { TransferProxyTest } from "../../typechain/TransferProxyTest"
import { ERC20TransferProxyTest } from "../../typechain/ERC20TransferProxyTest"
import { ExchangeV2 } from "../../typechain/ExchangeV2"

import { PartyRarible } from "../../typechain/PartyRarible"
import { Web3Ethereum } from "@rarible/web3-ethereum"

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
  await nftContract.mint(artistSigner.address, toBigNumber("1"))
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

type TokensAndFracionsFixture = TokensFixture & FractionsFixture

interface ExchangeFixture extends TokensAndFracionsFixture {
  transferProxy: TransferProxyTest
  erc20TransferProxy: ERC20TransferProxyTest
  exchange: ExchangeV2
  left: SimpleOrder
}

export const exchangeFixture: Fixture<ExchangeFixture> = async function (
  [wallet, other, artistSigner],
  provider
): Promise<ExchangeFixture> {
  const { weth, nftContract } = await tokensFixture(
    [wallet, other, artistSigner],
    provider
  )

  const { settings, vaultFactory } = await fractionsFixture(
    [wallet, other, artistSigner],
    provider
  )

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

  const exchangeFactory = await ethers.getContractFactory("ExchangeSimpleV2")
  const exchange = (await upgrades.deployProxy(
    exchangeFactory,
    [transferProxy.address, erc20TransferProxy.address],
    { initializer: "__ExchangeSimpleV2_init" }
  )) as ExchangeV2

  // Approve NFT Transfer to Foundation Exchange
  await nftContract
    .connect(artistSigner)
    .setApprovalForAll(transferProxy.address, true)

  const reservePrice = eth("10")
  // place order
  const left: SimpleOrder = {
    make: {
      assetType: {
        assetClass: "ERC721",
        contract: toAddress(nftContract.address),
        tokenId: toBigNumber("1"),
      },
      value: toBigNumber("1"),
    },
    maker: toAddress(artistSigner.address),
    take: {
      assetType: {
        assetClass: "ETH",
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
  const ethereum2 = new Web3Ethereum({
    web3,
    from: toAddress(artistSigner.address),
    gas: 1000000,
  })
  const signature = await signOrder(
    ethereum2,
    {
      chainId: 1,
      exchange: {
        v1: toAddress(exchange.address),
        v2: toAddress(exchange.address),
      },
    },
    left
  )
  left.signature = signature
  await exchange.connect(artistSigner).upsertOrder(orderToStruct(left))
  return {
    weth,
    nftContract,
    settings,
    vaultFactory,
    transferProxy,
    erc20TransferProxy,
    exchange,
    left,
  }
}
