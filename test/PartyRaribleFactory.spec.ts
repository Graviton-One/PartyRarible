import { ethers, waffle, web3 } from "hardhat"
import { BigNumber } from "ethers"

import { exchangeFixture } from "./shared/fixtures"

import { IWETH } from "../typechain/IWETH"
import { TestERC721 } from "../typechain/TestERC721"
import { Settings } from "../typechain/Settings"
import { ERC721VaultFactory } from "../typechain/ERC721VaultFactory"
import { TokenVault } from "../typechain/TokenVault"

import { LibOrderTest } from "../typechain/LibOrderTest"
import { TransferProxyTest } from "../typechain/TransferProxyTest"
import { ERC20TransferProxyTest } from "../typechain/ERC20TransferProxyTest"
import { ExchangeV2 } from "../typechain/ExchangeV2"

import { PartyRarible } from "../typechain/PartyRarible"
import { PartyRaribleFactory } from "../typechain/PartyRaribleFactory"

import { Web3Ethereum } from "@rarible/web3-ethereum"

import { expect } from "./shared/expect"

import {
  eth,
  tokenID1,
  tokenID2,
  tokenID3,
  assetTypeToStruct,
  SimpleOrder,
  orderToStruct,
  EMPTY_SIG,
  signOrder,
} from "./shared/utilities"

import {
  toAddress,
  toBigNumber,
  toBinary,
  randomWord,
  ZERO_ADDRESS,
  toWord,
} from "@rarible/types"

import { Asset, AssetType, Order } from "@rarible/protocol-api-client"

describe.only("PartyRarible", () => {
  const [wallet, other, artistSigner] = waffle.provider.getWallets()

  let loadFixture: ReturnType<typeof waffle.createFixtureLoader>

  before("create fixture loader", async () => {
    loadFixture = waffle.createFixtureLoader([wallet, other, artistSigner])
  })

  let weth: IWETH
  let nftContract: TestERC721
  let transferProxy: TransferProxyTest
  let erc20TransferProxy: ERC20TransferProxyTest
  let exchange: ExchangeV2
  let partyRarible: PartyRarible
  let partyRaribleFactory: PartyRaribleFactory
  let settings: Settings
  let vaultFactory: ERC721VaultFactory
  let left: SimpleOrder

  beforeEach("deploy test contracts", async () => {
    ;({
      weth,
      nftContract,
      settings,
      vaultFactory,
      transferProxy,
      erc20TransferProxy,
      exchange,
      left,
    } = await loadFixture(exchangeFixture))
  })

  describe("#startParty", async () => {
    it("initializes a party", async () => {
      const partyFactoryFactory = await ethers.getContractFactory(
        "PartyRaribleFactory"
      )
      const ethAssetType: AssetType = {
        assetClass: "ETH",
      }
      const nftAssetType: AssetType = {
        assetClass: "ERC721",
        contract: toAddress(nftContract.address),
        tokenId: toBigNumber("2"),
      }
      const partyFactory = (await partyFactoryFactory.deploy(
        wallet.address,
        vaultFactory.address,
        weth.address,
        exchange.address,
        wallet.address,
        nftContract.address,
        1,
        assetTypeToStruct(ethAssetType),
        assetTypeToStruct(nftAssetType)
      )) as PartyRaribleFactory

      const tx = await partyFactory.startParty(
        exchange.address,
        wallet.address,
        nftContract.address,
        1,
        assetTypeToStruct(ethAssetType),
        assetTypeToStruct(nftAssetType),
        "A",
        "B"
      )

      const receipt = await tx.wait()
      const log = receipt.logs[0]

      const addr = "0x" + ethers.utils.hexDataSlice(log.data, 12, 32)
    })
  })
})
