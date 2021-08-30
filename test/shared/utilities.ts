import { ethers, waffle } from "hardhat"
import { BigNumber, BigNumberish } from "ethers"

import Web3 from "web3"
import {
  toAddress,
  toBigNumber,
  toBinary,
  randomWord,
  ZERO_ADDRESS,
  toWord,
} from "@rarible/types"
import {
  Asset,
  Binary,
  EIP712Domain,
  AssetType,
  Order,
} from "@rarible/protocol-api-client"
import { OrderData } from "@rarible/protocol-api-client/build/models/OrderData"
import { Ethereum, signTypedData } from "@rarible/ethereum-provider"

const abi = new Web3().eth.abi

export const tokenID1 = 1
export const tokenID2 = 2
export const tokenID3 = 3

export function eth(num: string): BigNumber {
  return ethers.utils.parseEther(num)
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
function assetTypeToStruct(assetType: AssetType) {
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

// async function signOrder(
//   ethereum: Ethereum,
//   config: Pick<Config, "exchange" | "chainId">,
//   order: SimpleOrder
// ): Promise<Binary> {
//   switch (order.type) {
//     case "RARIBLE_V1": {
//       const legacyHash = hashLegacyOrder(order)
//       return toBinary(await ethereum.personalSign(legacyHash.substring(2)))
//     }
//     case "RARIBLE_V2": {
//       const domain = createEIP712Domain(config.chainId, config.exchange.v2)
//       const signature = await signTypedData(ethereum, {
//         primaryType: EIP712_ORDER_TYPE,
//         domain,
//         types: EIP712_ORDER_TYPES,
//         message: orderToStruct(order),
//       })
//       return toBinary(signature)
//     }
//     default: {
//       throw new Error(`Unsupported order type: ${order.type}`)
//     }
//   }
// }

const TEST_ORDER_TEMPLATE: Omit<SimpleOrder, "type" | "data"> = {
  make: {
    assetType: {
      assetClass: "ERC721",
      contract: toAddress("0x0000000000000000000000000000000000000001"),
      tokenId: toBigNumber("10"),
    },
    value: toBigNumber("10"),
  },
  maker: toAddress("0x0000000000000000000000000000000000000002"),
  take: {
    assetType: {
      assetClass: "ERC721",
      contract: toAddress("0x0000000000000000000000000000000000000001"),
      tokenId: toBigNumber("10"),
    },
    value: toBigNumber("10"),
  },
  salt: toWord(
    "0x000000000000000000000000000000000000000000000000000000000000000a"
  ),
}

const CONTRACT_TOKEN_ID = {
  contract: "address",
  tokenId: "uint256",
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

export const EIP712_ORDER_TYPES = {
  EIP712Domain: [
    { type: "string", name: "name" },
    { type: "string", name: "version" },
    { type: "uint256", name: "chainId" },
    { type: "address", name: "verifyingContract" },
  ],
  AssetType: [
    { name: "assetClass", type: "bytes4" },
    { name: "data", type: "bytes" },
  ],
  Asset: [
    { name: "assetType", type: "AssetType" },
    { name: "value", type: "uint256" },
  ],
  Order: [
    { name: "maker", type: "address" },
    { name: "makeAsset", type: "Asset" },
    { name: "taker", type: "address" },
    { name: "takeAsset", type: "Asset" },
    { name: "salt", type: "uint256" },
    { name: "start", type: "uint256" },
    { name: "end", type: "uint256" },
    { name: "dataType", type: "bytes4" },
    { name: "data", type: "bytes" },
  ],
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
