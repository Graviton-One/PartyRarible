import Web3 from "web3"
import {
  toAddress,
  toBigNumber,
  Binary,
  toBinary,
  randomWord,
  ZERO_ADDRESS,
  Address,
  toWord,
  BigNumber as BN,
} from "@rarible/types"
import {
  Asset,
  AssetType,
  Order,
  EIP712Domain,
} from "@rarible/protocol-api-client"
import { OrderData } from "@rarible/protocol-api-client/build/models/OrderData"
import { Web3Ethereum } from "@rarible/web3-ethereum"
import { Ethereum, signTypedData } from "@rarible/ethereum-provider"
const abi = new Web3().eth.abi

const ASSET = {
  token: "address",
  tokenId: "uint256",
  assetType: "uint8",
}
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

export async function signOrder(
  ethereum: Ethereum,
  config: Pick<Config, "exchange" | "chainId">,
  order: SimpleOrder
): Promise<Binary> {
  switch (order.type) {
    case "RARIBLE_V1": {
      const legacyHash = hashLegacyOrder(order)
      return toBinary(await ethereum.personalSign(legacyHash.substring(2)))
    }
    case "RARIBLE_V2": {
      const domain = createEIP712Domain(config.chainId, config.exchange.v2)
      const signature = await signTypedData(ethereum, {
        primaryType: EIP712_ORDER_TYPE,
        domain,
        types: EIP712_ORDER_TYPES,
        message: orderToStruct(order),
      })
      return toBinary(signature)
    }
    default: {
      throw new Error(`Unsupported order type: ${order.type}`)
    }
  }
}

export const EIP712_ORDER_NAME = "Exchange"

export const EIP712_ORDER_VERSION = "2"

export const EIP712_ORDER_TYPE = "Order"

export const EIP712_DOMAIN_TEMPLATE = {
  name: EIP712_ORDER_NAME,
  version: EIP712_ORDER_VERSION,
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

function createEIP712Domain(
  chainId: number,
  verifyingContract: Address
): EIP712Domain {
  return {
    ...EIP712_DOMAIN_TEMPLATE,
    verifyingContract: verifyingContract,
    chainId,
  }
}

export function hashLegacyOrder(order: SimpleOrder): string {
  if (order.type !== "RARIBLE_V1") {
    throw new Error(`Not supported type: ${order.type}`)
  }
  const data = order.data
  if (data.dataType !== "LEGACY") {
    throw new Error(`Not supported data type: ${data.dataType}`)
  }

  const makeType = toLegacyAssetType(order.make.assetType)
  const takeType = toLegacyAssetType(order.take.assetType)

  const struct = {
    key: {
      owner: order.maker,
      salt: order.salt,
      sellAsset: makeType,
      buyAsset: takeType,
    },
    selling: order.make.value,
    buying: order.take.value,
    sellerFee: data.fee,
  }

  return Web3.utils.sha3(
    abi.encodeParameter({ Order: ORDER }, struct)
  ) as string
}

export function toLegacyAssetType(assetType: AssetType): LegacyAssetType {
  switch (assetType.assetClass) {
    case "ETH":
      return {
        assetType: 0,
        token: ZERO_ADDRESS,
        tokenId: toBigNumber("0"),
      }
    case "ERC20":
      return {
        assetType: 1,
        token: assetType.contract,
        tokenId: toBigNumber("0"),
      }
    case "ERC721":
      return {
        assetType: 3,
        token: assetType.contract,
        tokenId: assetType.tokenId,
      }
    case "ERC1155":
      return {
        assetType: 2,
        token: assetType.contract,
        tokenId: assetType.tokenId,
      }
    default: {
      throw new Error("Unsupported")
    }
  }
}

const ORDER = {
  key: {
    owner: "address",
    salt: "uint256",
    sellAsset: ASSET,
    buyAsset: ASSET,
  },
  selling: "uint256",
  buying: "uint256",
  sellerFee: "uint256",
}
type LegacyAssetType = {
  assetType: number
  token: Address
  tokenId: BN
}

export type Config = {
  basePath: string
  chainId: number
  exchange: ExchangeAddresses
  transferProxies: TransferProxies
  fees: ExchangeFees
}

export type ExchangeFees = {
  v2: number
}

export type ExchangeAddresses = {
  v1: Address
  v2: Address
}

export type TransferProxies = {
  nft: Address
  erc20: Address
  erc721Lazy: Address
  erc1155Lazy: Address
}
