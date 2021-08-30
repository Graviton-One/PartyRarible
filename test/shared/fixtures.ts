import { ethers, waffle, upgrades } from "hardhat"
import { BigNumber } from "ethers"

import { Fixture } from "ethereum-waffle"
import { eth, tokenID1, tokenID2, tokenID3 } from "./utilities"

import { IWETH } from "../../typechain/IWETH"
import { TestERC721 } from "../../typechain/TestERC721"

import { LibOrderTest } from "../../typechain/LibOrderTest"
import { TransferProxyTest } from "../../typechain/TransferProxyTest"
import { ERC20TransferProxyTest } from "../../typechain/ERC20TransferProxyTest"
import { ExchangeV2 } from "../../typechain/ExchangeV2"

import { IPartyRarible } from "../../typechain/IPartyRarible"

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

  // For other markets, deploy the test NFT Contract
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

interface MarketFixture extends TokensFixture {
  market: ExchangeV2
}

export const marketFixture: Fixture<MarketFixture> = async function (
  [wallet, other, artistSigner],
  provider
): Promise<MarketFixture> {
  const { weth, nftContract } = await tokensFixture(
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
    (await ERC20TransferProxyTestFactory.deploy()) as ERC20TransferProxyTest

  const exchangeFactory = await ethers.getContractFactory("ExchangeSimpleV2")
  const exchange = await upgrades.deployProxy(
    exchangeFactory,
    [transferProxy.address, erc20TransferProxy.address],
    { initializer: "__ExchangeSimpleV2_init" }
  )

  // Approve NFT Transfer to Foundation Market
  await nftContract.connect(artistSigner).approve(market.address, tokenID1)

  const reservePrice = eth(10)
  await market.createReserveAuction(nftContract.address, tokenID1, reservePrice)
  await market.createReserveAuction(nftContract.address, tokenID2, reservePrice)

  return {
    weth,
    nftContract,
    market,
    marketWrapper,
  }
}

interface PartyRaribleFixture extends MarketFixture {
  partyRarible: IPartyRarible
}

export const partyRaribleFixture: Fixture<PartyRaribleFixture> =
  async function (
    [wallet, other, artistSigner],
    provider
  ): Promise<PartyRaribleFixture> {
    const { weth, nftContract, market, marketWrapper } = await marketFixture(
      [wallet, other, artistSigner],
      provider
    )

    let partyRaribleFactory = await ethers.getContractFactory("PartyRarible")
    let partyRarible = (await partyRaribleFactory.deploy()) as IPartyRarible

    return {
      weth,
      nftContract,
      market,
      marketWrapper,
      partyRarible,
    }
  }
