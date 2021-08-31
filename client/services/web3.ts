import { ethers, BigNumber } from "ethers"
import Web3 from "web3"

import { IWETH } from "../../typechain/IWETH"
import { TestERC721 } from "../../typechain/TestERC721"
import { Settings } from "../../typechain/Settings"
import { ERC721VaultFactory } from "../../typechain/ERC721VaultFactory"
import { TokenVault } from "../../typechain/TokenVault"

import { LibOrderTest } from "../../typechain/LibOrderTest"
import { TransferProxyTest } from "../../typechain/TransferProxyTest"
import { ERC20TransferProxyTest } from "../../typechain/ERC20TransferProxyTest"
import { ExchangeV2 } from "../../typechain/ExchangeV2"

import { PartyRarible } from "../../typechain/PartyRarible"
import { PartyRaribleFactory } from "../../typechain/PartyRaribleFactory"

import { Web3Ethereum } from "@rarible/web3-ethereum"

import {
  assetTypeToStruct,
  orderToStruct,
  SimpleOrder,
  signOrder,
} from "./utilities"

const IWETHABI = require("../../abi/IWETH.json")
const TestERC721ABI = require("../../abi/TestERC721.json")
const SettingsABI = require("../../abi/Settings.json")
const ERC721VaultFactoryABI = require("../../abi/ERC721VaultFactory.json")
const TokenVaultABI = require("../../abi/TokenVault.json")
const ExchangeV2ABI = require("../../abi/ExchangeV2.json")
const PartyRaribleABI = require("../../abi/PartyRarible.json")
const PartyRaribleFactoryABI = require("../../abi/PartyRaribleFactory.json")

import {
  toAddress,
  toBigNumber,
  toBinary,
  randomWord,
  ZERO_ADDRESS,
  toWord,
} from "@rarible/types"
import { Asset, AssetType, Order } from "@rarible/protocol-api-client"

import { PLG, RKB } from "./constants"

export default class Invoker {
  metamask: ethers.providers.Web3Provider
  signer: ethers.Signer
  web3: Web3
  constructor(_metamask: ethers.providers.Web3Provider, _web3: Web3) {
    this.metamask = _metamask
    this.signer = _metamask.getSigner()
    this.web3 = _web3
  }

  async mint(nft: string, to: string, id: string): Promise<string> {
    const nftContract = new ethers.Contract(
      nft,
      TestERC721ABI,
      this.signer
    ) as TestERC721
    const bal = await nftContract.mint(to, id)
    return bal.toString()
  }

  async startParty(
    exchange: string,
    partyFactory: string,
    nft: string,
    id: string
  ): Promise<string> {
    const partyFactoryContract = new ethers.Contract(
      partyFactory,
      PartyRaribleFactoryABI,
      this.signer
    ) as PartyRaribleFactory

    const ethAssetType: AssetType = {
      assetClass: "ETH",
    }
    const nftAssetType: AssetType = {
      assetClass: "ERC721",
      contract: toAddress(nft),
      tokenId: toBigNumber(id),
    }

    const signerAddress = await this.signer.getAddress()

    const totalProxies = await await partyFactoryContract.totalProxies()
    const tx = await partyFactoryContract.startParty(
      exchange,
      signerAddress,
      nft,
      id,
      assetTypeToStruct(ethAssetType),
      assetTypeToStruct(nftAssetType),
      "Rarible Party",
      "RBLP"
    )
    const receipt = await tx.wait()
    console.log(receipt.logs[0])
    const log = receipt.logs[0]

    return await partyFactoryContract.proxies(totalProxies)
  }

  async contribute(party: string, amount: string) {
    const partyContract = new ethers.Contract(
      party,
      PartyRaribleABI,
      this.signer
    ) as PartyRarible
    await partyContract.contribute({ value: amount })
  }
  async placeNFT(
    exchange: string,
    nft: string,
    id: string,
    amount: string
  ): Promise<string> {
    const signerAddress = await this.signer.getAddress()

    const network = await this.metamask.getNetwork()
    const chainId = network.chainId

    console.log(exchange, nft, id, amount, chainId)
    const nftContract = new ethers.Contract(
      nft,
      TestERC721ABI,
      this.signer
    ) as TestERC721
    const owner = await nftContract.ownerOf(id)

    const exchangeContract = new ethers.Contract(
      exchange,
      ExchangeV2ABI,
      this.signer
    ) as ExchangeV2

    const makeOrder: SimpleOrder = {
      make: {
        assetType: {
          assetClass: "ERC721",
          contract: toAddress(nft),
          tokenId: toBigNumber(id),
        },
        value: toBigNumber("1"),
      },
      maker: toAddress(owner),
      take: {
        assetType: {
          assetClass: "ETH",
        },
        value: toBigNumber(amount),
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
      web3: this.web3,
      from: toAddress(signerAddress),
      gas: 1000000,
    })

    const signature = await signOrder(
      ethereum2,
      {
        chainId: chainId,
        exchange: {
          v1: toAddress(exchange),
          v2: toAddress(exchange),
        },
      },
      makeOrder
    )
    console.log(signature)

    await exchangeContract.upsertOrder(orderToStruct(makeOrder))

    return signature
  }
  async fillETH(
    party: string,
    amount: string,
    nft: string,
    id: string,
    signature: string
  ) {
    const signerAddress = await this.signer.getAddress()
    const nftContract = new ethers.Contract(
      nft,
      TestERC721ABI,
      this.signer
    ) as TestERC721
    const owner = await nftContract.ownerOf(id)
    const partyContract = new ethers.Contract(
      party,
      PartyRaribleABI,
      this.signer
    ) as PartyRarible

    const makeOrder: SimpleOrder = {
      make: {
        assetType: {
          assetClass: "ERC721",
          contract: toAddress(nft),
          tokenId: toBigNumber(id),
        },
        value: toBigNumber("1"),
      },
      maker: toAddress(owner),
      take: {
        assetType: {
          assetClass: "ETH",
        },
        value: toBigNumber(amount),
      },
      salt: randomWord(),
      type: "RARIBLE_V2",
      data: {
        dataType: "RARIBLE_V2_DATA_V1",
        payouts: [],
        originFees: [],
      },
    }

    await partyContract.fill(orderToStruct(makeOrder), signature)
  }
  async placeETH(party: string) {
    const partyContract = new ethers.Contract(
      party,
      PartyRaribleABI,
      this.signer
    ) as PartyRarible
    await partyContract.place()
  }
  async fillNFT(
    transferProxy: string,
    exchange: string,
    party: string,
    nft: string,
    id: string,
    amount: string
  ): Promise<string> {
    const signerAddress = await this.signer.getAddress()

    const network = await this.metamask.getNetwork()
    const chainId = network.chainId

    const nftContract = new ethers.Contract(
      nft,
      TestERC721ABI,
      this.signer
    ) as TestERC721
    const owner = await nftContract.ownerOf(id)

    await nftContract.setApprovalForAll(transferProxy, true)

    const exchangeContract = new ethers.Contract(
      exchange,
      ExchangeV2ABI,
      this.signer
    ) as ExchangeV2

    const left: SimpleOrder = {
      make: {
        assetType: {
          assetClass: "ETH",
        },
        value: toBigNumber(amount),
      },
      maker: toAddress(party),
      take: {
        assetType: {
          assetClass: "ERC721",
          contract: toAddress(nft),
          tokenId: toBigNumber(id),
        },
        value: toBigNumber("1"),
      },
      salt: randomWord(),
      type: "RARIBLE_V2",
      data: {
        dataType: "RARIBLE_V2_DATA_V1",
        payouts: [],
        originFees: [],
      },
    }

    const right: SimpleOrder = {
      make: {
        assetType: {
          assetClass: "ERC721",
          contract: toAddress(nft),
          tokenId: toBigNumber(id),
        },
        value: toBigNumber("1"),
      },
      maker: toAddress(owner),
      take: {
        assetType: {
          assetClass: "ETH",
        },
        value: toBigNumber(amount),
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
      web3: this.web3,
      from: toAddress(signerAddress),
      gas: 1000000,
    })

    const signature = await signOrder(
      ethereum2,
      {
        chainId: chainId,
        exchange: {
          v1: toAddress(exchange),
          v2: toAddress(exchange),
        },
      },
      right
    )

    console.log(signature)

    await exchangeContract.matchOrders(
      orderToStruct(left),
      signature,
      orderToStruct(right),
      signature
    )

    return signature
  }

  async finalize(party: string) {
    const partyContract = new ethers.Contract(
      party,
      PartyRaribleABI,
      this.signer
    ) as PartyRarible
    await partyContract.finalize()
    return await partyContract.tokenVault()
  }
  async claim(party: string) {
    const partyContract = new ethers.Contract(
      party,
      PartyRaribleABI,
      this.signer
    ) as PartyRarible
    const signerAddress = await this.signer.getAddress()
    await partyContract.claim(signerAddress)
  }
  async partyTokens(vault: string): Promise<string> {
    const vaultContract = new ethers.Contract(
      vault,
      TokenVaultABI,
      this.signer
    ) as TokenVault
    const supply = await vaultContract.totalSupply()
    return supply.toString()
  }
  async partyShare(vault: string, account: string): Promise<string> {
    const vaultContract = new ethers.Contract(
      vault,
      TokenVaultABI,
      this.signer
    ) as TokenVault
    const balance = await vaultContract.balanceOf(account)
    return balance.toString()
  }
  async nftOwner(nft: string, id: string): Promise<string> {
    const nftContract = new ethers.Contract(
      nft,
      TestERC721ABI,
      this.signer
    ) as TestERC721
    const owner = await nftContract.ownerOf(id)
    return owner
  }
}
