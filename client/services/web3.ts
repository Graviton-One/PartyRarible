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

import { assetTypeToStruct, orderToStruct, SimpleOrder } from "./utilities"

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

import { C } from "./constants"

export default class Invoker {
  metamask: ethers.providers.Web3Provider
  signer: ethers.Signer
  constructor(_metamask: ethers.providers.Web3Provider) {
    this.metamask = _metamask
    this.signer = _metamask.getSigner()
  }
  async fill(
    party: string,
    amount: string,
    nft: string,
    id: string,
    signature: string
  ) {
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
  async place(party: string) {
    const partyContract = new ethers.Contract(
      party,
      PartyRaribleABI,
      this.signer
    ) as PartyRarible
    await partyContract.place()
  }
  async contribute(party: string, amount: string) {
    const partyContract = new ethers.Contract(
      party,
      PartyRaribleABI,
      this.signer
    ) as PartyRarible
    await partyContract.contribute({ value: amount })
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
  async mint(nft: string, to: string, id: string): Promise<string> {
    const nftContract = new ethers.Contract(
      nft,
      TestERC721ABI,
      this.signer
    ) as TestERC721
    const bal = await nftContract.mint(to, id)
    return bal.toString()
  }
  async startParty(nft: string, id: string): Promise<string> {
    const partyFactory = new ethers.Contract(
      C.partyFactory,
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
    const tx = await partyFactory.startParty(
      C.exchange,
      signerAddress,
      nft,
      id,
      assetTypeToStruct(ethAssetType),
      assetTypeToStruct(nftAssetType),
      "Rarible Party",
      "RBLP"
    )
    const receipt = await tx.wait()
    const log = receipt.logs[0]

    const addr = "0x" + ethers.utils.hexDataSlice(log.data, 12, 32)
    return addr
  }
}
