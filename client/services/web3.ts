import { ethers, BigNumber } from "ethers"

import { IWETH } from "../../typechain/IWETH"
import { TestERC721 } from "../../typechain/TestERC721"
import { Settings } from "../../typechain/Settings"
import { ERC721VaultFactory } from "../../typechain/ERC721VaultFactory"

import { LibOrderTest } from "../../typechain/LibOrderTest"
import { TransferProxyTest } from "../../typechain/TransferProxyTest"
import { ERC20TransferProxyTest } from "../../typechain/ERC20TransferProxyTest"
import { ExchangeV2 } from "../../typechain/ExchangeV2"

import { PartyRarible } from "../../typechain/PartyRarible"
import { PartyRaribleFactory } from "../../typechain/PartyRaribleFactory"

import { assetTypeToStruct } from "../../test/shared/utilities"

const IWETHABI = require("../../abi/IWETH.json")
const TestERC721ABI = require("../../abi/TestERC721.json")
const SettingsABI = require("../../abi/Settings.json")
const ERC721VaultFactoryABI = require("../../abi/ERC721VaultFactory.json")
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
    this.signer = this.metamask.getSigner()
  }

  async startParty(nft: string, id: string) {
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
    const tx = await partyFactory.startParty(
      C.exchange,
      await this.signer.getAddress(),
      nft,
      id,
      assetTypeToStruct(ethAssetType),
      assetTypeToStruct(nftAssetType),
      "Rarible Party",
      "RBLP"
    )
    const receipt = await tx.wait()
    const log = receipt.logs[0]
    console.log(log)
  }
}
