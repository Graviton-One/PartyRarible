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

describe("PartyRarible", () => {
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

  describe("#take", async () => {
    it("fills onchain make order, receives nft", async () => {
      const partyFactory = await ethers.getContractFactory("PartyRarible")
      partyRarible = (await partyFactory.deploy(
        wallet.address,
        vaultFactory.address,
        weth.address
      )) as PartyRarible

      const ethAssetType: AssetType = {
        assetClass: "ETH",
        // contract: toAddress(weth.address),
      }
      const nftAssetType: AssetType = {
        assetClass: "ERC721",
        contract: toAddress(nftContract.address),
        tokenId: toBigNumber("1"),
      }
      await partyRarible.initialize(
        exchange.address,
        artistSigner.address,
        nftContract.address,
        "1",
        assetTypeToStruct(ethAssetType),
        assetTypeToStruct(nftAssetType),
        "Well done",
        "WD"
      )

      await partyRarible.contribute({ value: toBigNumber("10") })

      await partyRarible.fill(orderToStruct(left), left.signature || "0x")

      expect(await nftContract.ownerOf(toBigNumber("1"))).to.eq(
        partyRarible.address
      )
    })
  })

  describe("#make", async () => {
    it("places an onchain make order, receives nft when filled", async () => {
      const partyFactory = await ethers.getContractFactory("PartyRarible")
      partyRarible = (await partyFactory.deploy(
        wallet.address,
        vaultFactory.address,
        weth.address
      )) as PartyRarible

      const ethAssetType: AssetType = {
        assetClass: "ETH",
      }
      const nftAssetType: AssetType = {
        assetClass: "ERC721",
        contract: toAddress(nftContract.address),
        tokenId: toBigNumber("2"),
      }

      await partyRarible.initialize(
        exchange.address,
        artistSigner.address,
        nftContract.address,
        "2",
        assetTypeToStruct(ethAssetType),
        assetTypeToStruct(nftAssetType),
        "Well done",
        "WD"
      )

      await partyRarible.contribute({ value: toBigNumber("10") })

      await partyRarible.place()
      const order = await partyRarible.makeETHOrder()

      const right: SimpleOrder = {
        make: {
          assetType: {
            assetClass: "ERC721",
            contract: toAddress(nftContract.address),
            tokenId: toBigNumber("2"),
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
        right
      )
      await exchange.connect(artistSigner).matchOrders(
        order,
        // orderToStruct(order),
        signature,
        orderToStruct(right),
        signature
      )

      expect(await nftContract.ownerOf(toBigNumber("2"))).to.eq(
        partyRarible.address
      )
    })
  })

  describe("#finalize & claim", async () => {
    it("fractionalizes nft after purchase", async () => {
      const partyFactory = await ethers.getContractFactory("PartyRarible")
      partyRarible = (await partyFactory.deploy(
        wallet.address,
        vaultFactory.address,
        weth.address
      )) as PartyRarible

      const ethAssetType: AssetType = {
        assetClass: "ETH",
        // contract: toAddress(weth.address),
      }
      const nftAssetType: AssetType = {
        assetClass: "ERC721",
        contract: toAddress(nftContract.address),
        tokenId: toBigNumber("1"),
      }
      await partyRarible.initialize(
        exchange.address,
        artistSigner.address,
        nftContract.address,
        "1",
        assetTypeToStruct(ethAssetType),
        assetTypeToStruct(nftAssetType),
        "Well done",
        "WD"
      )

      await partyRarible.connect(wallet).contribute({ value: toBigNumber("7") })
      await partyRarible.connect(other).contribute({ value: toBigNumber("3") })

      await partyRarible.fill(orderToStruct(left), left.signature || "0x")

      await partyRarible.finalize()

      const tokenVaultAddress = await partyRarible.tokenVault()
      const tokenVaultFactory = await ethers.getContractFactory("TokenVault")
      const tokenVault = tokenVaultFactory.attach(
        tokenVaultAddress
      ) as TokenVault

      await partyRarible.claim(wallet.address)
      await partyRarible.claim(other.address)

      expect(await tokenVault.balanceOf(wallet.address)).to.eq("7000")
      expect(await tokenVault.balanceOf(other.address)).to.eq("3000")
    })
  })
})
