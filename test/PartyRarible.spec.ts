import { ethers, waffle } from "hardhat"
import { BigNumber } from "ethers"

import { exchangeFixture } from "./shared/fixtures"

import { IWETH } from "../typechain/IWETH"
import { TestERC721 } from "../typechain/TestERC721"

import { LibOrderTest } from "../typechain/LibOrderTest"
import { TransferProxyTest } from "../typechain/TransferProxyTest"
import { ERC20TransferProxyTest } from "../typechain/ERC20TransferProxyTest"
import { ExchangeV2 } from "../typechain/ExchangeV2"

import { PartyRarible } from "../typechain/PartyRarible"

import { expect } from "./shared/expect"
import { eth, tokenID1, tokenID2, tokenID3 } from "./shared/utilities"

describe.only("PARTYRARIBLE", () => {
  const [wallet, other] = waffle.provider.getWallets()

  let loadFixture: ReturnType<typeof waffle.createFixtureLoader>

  before("create fixture loader", async () => {
    loadFixture = waffle.createFixtureLoader([wallet, other])
  })

  let weth: IWETH
  let nftContract: TestERC721
  let exchange: ExchangeV2
  let partyRarible: PartyRarible

  beforeEach("deploy test contracts", async () => {
    ;({ weth, nftContract, exchange } = await loadFixture(exchangeFixture))
  })

  describe("#initialize", async () => {
    it("matches estimates", async () => {
      const partyFactory = await ethers.getContractFactory("PartyRarible")
      partyRarible = (await partyFactory.deploy()) as PartyRarible
    })
  })
})
