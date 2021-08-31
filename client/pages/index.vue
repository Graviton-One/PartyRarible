<template>
  <div class="container">
    <div>
      <div>
        <Button class="button--green" size="large" ghost @click="update"
          >Update</Button
        >
        <div>Chain: {{ chain }}</div>
        <div>
          Account: <input v-model="account" placeholder="user address" />
        </div>
        <div>
          NFT:
          <input v-model="nftContract" placeholder="ERC721 contract" />
        </div>
        <div>
          TokenID: <input v-model="tokenID" placeholder="ERC721 token id" />
        </div>
        <div>
          Amount:
          <input v-model="amount" placeholder="amount" />
        </div>
        <div>
          Signature:
          <input v-model="signature" placeholder="make order signature" />
        </div>
        <div>
          Party:
          <input v-model="party" placeholder="party address (save it)" />
        </div>
        <div>
          Vault:
          <input v-model="tokenVault" placeholder="vault address (save it)" />
        </div>
        <Button class="button--green" size="large" ghost @click="mint"
          >Mint</Button
        >
        <Button class="button--green" size="large" ghost @click="startParty"
          >Start Party</Button
        >
        <Button class="button--green" size="large" ghost @click="contribute"
          >Contribute to DAO</Button
        >
        <Button class="button--green" size="large" ghost @click="placeNFT"
          >Place NFT</Button
        >
        <Button class="button--green" size="large" ghost @click="fillETH"
          >Fill ETH as DAO</Button
        >
        <Button class="button--green" size="large" ghost @click="placeETH"
          >Place ETH as DAO</Button
        >
        <Button class="button--green" size="large" ghost @click="fillNFT"
          >Fill NFT</Button
        >
        <Button class="button--green" size="large" ghost @click="finalize"
          >Try to finalize</Button
        >
        <Button class="button--green" size="large" ghost @click="claim"
          >Claim tokens</Button
        >
        <div>Vault tokens: {{ vaultTokens }}</div>
        <div>Vault share: {{ vaultShare }}</div>
        <div>NFT owner: {{ nftOwner }}</div>
        <div>{{ error }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue"
import { ethers, BigNumber } from "ethers"
import Invoker from "../services/web3.ts"
import { PLG, RKB } from "../services/constants.ts"

export default Vue.extend({
  data() {
    return {
      invoker: {},
      provider: {},
      nftContract: PLG.nftContract,
      tokenID: "1",
      error: "",
      party: "",
      account: "",
      nftOwner: "",
      signature: "",
      tokenVault: "",
      vaultTokens: "",
      vaultShare: "",
      amount: "",
      chain: "",
      c: PLG,
    }
  },
  async mounted() {
    await this.connect()
    await this.update()
  },
  methods: {
    async connect() {
      await window.ethereum.enable()
      this.provider = new ethers.providers.Web3Provider(window.ethereum)
      const web3 = new Web3(window.ethereum)
      this.invoker = new Invoker(this.provider, web3)
      const signer = this.provider.getSigner()
      this.account = await signer.getAddress()
      console.log("Invoker loaded:", this.invoker)
    },
    async update() {
      try {
        const network = await this.provider.getNetwork()
        const chainId = network.chainId
        if (chainId == 137) {
          this.chain = "PLG"
          this.c = PLG
        } else if (chainId == 4) {
          this.chain = "RKB"
          this.c = RKB
        }
        this.partyTokens = await this.invoker.partyTokens(this.party)
      } catch (e) {
        console.log()
      }
      try {
        this.partyShare = await this.invoker.partyShare(
          this.party,
          this.account
        )
      } catch (e) {
        console.log()
      }
      try {
        this.nftOwner = await this.invoker.nftOwner(
          this.nftContract,
          this.tokenID
        )
      } catch (e) {
        console.log()
      }
    },
    async fillNFT() {
      try {
        await this.invoker.fillNFT(
          this.c.transferProxy,
          this.c.exchange,
          this.party,
          this.nftContract,
          this.tokenID,
          this.amount
        )
      } catch (e) {
        this.error = e
        console.log(e)
      }
    },
    async fillETH() {
      try {
        await this.invoker.fillETH(
          this.party,
          this.amount,
          this.nftContract,
          this.tokenID,
          this.signature
        )
      } catch (e) {
        this.error = e
        console.log(e)
      }
    },
    async placeNFT() {
      try {
        await this.invoker.placeNFT(
          this.c.exchange,
          this.nftContract,
          this.tokenID,
          this.amount
        )
      } catch (e) {
        this.error = e
        console.log(e)
      }
    },
    async placeETH() {
      try {
        await this.invoker.placeETH(this.party)
      } catch (e) {
        this.error = e
        console.log(e)
      }
    },
    async contribute() {
      try {
        await this.invoker.contribute(this.party, this.amount)
      } catch (e) {
        this.error = e
        console.log(e)
      }
    },
    async finalize() {
      try {
        this.tokenVault = await this.invoker.finalize(this.party)
      } catch (e) {
        this.error = e
        console.log(e)
      }
    },
    async claim() {
      try {
        await this.invoker.claim(this.party)
        await this.update
      } catch (e) {
        this.error = e
        console.log(e)
      }
    },
    async mint() {
      try {
        await this.invoker.mint(this.nftContract, this.account, this.tokenID)
      } catch (e) {
        this.error = e
        console.log(e)
      }
    },
    async startParty() {
      try {
        this.error = "Waiting for deploy..."
        this.party = await this.invoker.startParty(
          this.c.exchange,
          this.c.partyFactory,
          this.nftContract,
          this.tokenID
        )
        this.error = ""
      } catch (e) {
        this.error = e
        console.log(e)
      }
    },
    formatUnits(amount: BigNumber, precision: number): string {
      return ethers.utils.formatUnits(amount, precision)
    },
  },
})
</script>

<style>
.container {
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.title {
  font-family: "Quicksand", "Source Sans Pro", -apple-system, BlinkMacSystemFont,
    "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  display: block;
  font-weight: 300;
  font-size: 100px;
  color: #35495e;
  letter-spacing: 1px;
}

.subtitle {
  font-weight: 300;
  font-size: 42px;
  color: #526488;
  word-spacing: 5px;
  padding-bottom: 15px;
}

.links {
  padding-top: 15px;
}
</style>
