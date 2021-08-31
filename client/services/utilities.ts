import Web3 from "web3"
import {
  toAddress,
  toBigNumber,
  toBinary,
  randomWord,
  ZERO_ADDRESS,
  toWord,
} from "@rarible/types"
import { Asset, AssetType, Order } from "@rarible/protocol-api-client"
import { OrderData } from "@rarible/protocol-api-client/build/models/OrderData"
const abi = new Web3().eth.abi

export function assetTypeToStruct(assetType: AssetType) {
  switch (assetType.assetClass) {
    case "ETH":
      return {
        assetClass: ETH,
        data: "0x",
      }
    case "ERC20":
      return {
        assetClass: ERC20,
        data: abi.encodeParameter("address", assetType.contract),
      }
    case "ERC721":
      return {
        assetClass: ERC721,
        data: abi.encodeParameter(
          { root: CONTRACT_TOKEN_ID },
          { contract: assetType.contract, tokenId: assetType.tokenId }
        ),
      }
    case "ERC1155":
      return {
        assetClass: ERC1155,
        data: abi.encodeParameter(
          { root: CONTRACT_TOKEN_ID },
          { contract: assetType.contract, tokenId: assetType.tokenId }
        ),
      }
    case "ERC721_LAZY": {
      const encoded = abi.encodeParameter(ERC721_LAZY_TYPE, {
        contract: assetType.contract,
        data: {
          tokenId: assetType.tokenId,
          uri: assetType.uri,
          creators: assetType.creators,
          royalties: assetType.royalties,
          signatures: assetType.signatures,
        },
      })
      return {
        assetClass: ERC721_LAZY,
        data: `0x${encoded.substring(66)}`,
      }
    }
    case "ERC1155_LAZY": {
      const encoded = abi.encodeParameter(ERC1155_LAZY_TYPE, {
        contract: assetType.contract,
        data: {
          tokenId: assetType.tokenId,
          uri: assetType.uri,
          supply: assetType.supply,
          creators: assetType.creators,
          royalties: assetType.royalties,
          signatures: assetType.signatures,
        },
      })
      return {
        assetClass: ERC1155_LAZY,
        data: `0x${encoded.substring(66)}`,
      }
    }
    default: {
      throw new Error(`Unsupported asset class: ${assetType.assetClass}`)
    }
  }
}
const ETH = id("ETH")
const ERC20 = id("ERC20")
const ERC721 = id("ERC721")
const ERC1155 = id("ERC1155")
const ERC721_LAZY = id("ERC721_LAZY")
const ERC1155_LAZY = id("ERC1155_LAZY")

function id(s: string) {
  return Web3.utils.sha3(s)!.substring(0, 10)
}

const ERC721_LAZY_TYPE = {
  components: [
    {
      name: "contract",
      type: "address",
    },
    {
      components: [
        {
          name: "tokenId",
          type: "uint256",
        },
        {
          name: "uri",
          type: "string",
        },
        {
          components: [
            {
              name: "account",
              type: "address",
            },
            {
              name: "value",
              type: "uint96",
            },
          ],
          name: "creators",
          type: "tuple[]",
        },
        {
          components: [
            {
              name: "account",
              type: "address",
            },
            {
              name: "value",
              type: "uint96",
            },
          ],
          name: "royalties",
          type: "tuple[]",
        },
        {
          name: "signatures",
          type: "bytes[]",
        },
      ],
      name: "data",
      type: "tuple",
    },
  ],
  name: "data",
  type: "tuple",
}

const ERC1155_LAZY_TYPE = {
  components: [
    {
      name: "contract",
      type: "address",
    },
    {
      components: [
        {
          name: "tokenId",
          type: "uint256",
        },
        {
          name: "uri",
          type: "string",
        },
        {
          name: "supply",
          type: "uint256",
        },
        {
          components: [
            {
              name: "account",
              type: "address",
            },
            {
              name: "value",
              type: "uint96",
            },
          ],
          name: "creators",
          type: "tuple[]",
        },
        {
          components: [
            {
              name: "account",
              type: "address",
            },
            {
              name: "value",
              type: "uint96",
            },
          ],
          name: "royalties",
          type: "tuple[]",
        },
        {
          name: "signatures",
          type: "bytes[]",
        },
      ],
      name: "data",
      type: "tuple",
    },
  ],
  name: "data",
  type: "tuple",
}

const CONTRACT_TOKEN_ID = {
  contract: "address",
  tokenId: "uint256",
}

export type SimpleOrder = Pick<
  Order,
  | "data"
  | "maker"
  | "taker"
  | "make"
  | "take"
  | "salt"
  | "start"
  | "end"
  | "type"
  | "signature"
>
function encodeData(
  data: OrderData,
  wrongEncode: Boolean = false
): [string, string] {
  switch (data.dataType) {
    case "RARIBLE_V2_DATA_V1": {
      const encoded = abi.encodeParameter(DATA_V1_TYPE, {
        payouts: data.payouts,
        originFees: data.originFees,
      })
      if (wrongEncode) {
        return [id("V1"), `0x${encoded.substring(66)}`]
      }
      return [id("V1"), encoded]
    }
    default: {
      throw new Error(`Data type not supported: ${data.dataType}`)
    }
  }
}

export function orderToStruct(order: SimpleOrder) {
  const [dataType, data] = encodeData(order.data)
  return {
    maker: order.maker,
    makeAsset: assetToStruct(order.make),
    taker: order.taker ?? ZERO_ADDRESS,
    takeAsset: assetToStruct(order.take),
    salt: order.salt,
    start: order.start ?? 0,
    end: order.end ?? 0,
    dataType,
    data,
  }
}
function assetToStruct(asset: Asset) {
  return {
    assetType: assetTypeToStruct(asset.assetType),
    value: asset.value,
  }
}

const DATA_V1_TYPE = {
  components: [
    {
      components: [
        {
          name: "account",
          type: "address",
        },
        {
          name: "value",
          type: "uint96",
        },
      ],
      name: "payouts",
      type: "tuple[]",
    },
    {
      components: [
        {
          name: "account",
          type: "address",
        },
        {
          name: "value",
          type: "uint96",
        },
      ],
      name: "originFees",
      type: "tuple[]",
    },
  ],
  name: "data",
  type: "tuple",
}
