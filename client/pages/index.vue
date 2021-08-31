<template>
  <div class="container">
    <div>
      <div>
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
          Signature:
          <input v-model="signature" placeholder="make order signature" />
        </div>
        <Button class="button--green" size="large" ghost @click="mint"
          >Mint</Button
        >
        <Button class="button--green" size="large" ghost @click="startParty"
          >Start Party</Button
        >
        <Button class="button--green" size="large" ghost @click="update"
          >Update</Button
        >
        <Button class="button--green" size="large" ghost @click="place"
          >Place</Button
        >
        <Button class="button--green" size="large" ghost @click="fill"
          >Fill</Button
        >
        <Button class="button--green" size="large" ghost @click="contribute"
          >Contribute</Button
        >
        <Button class="button--green" size="large" ghost @click="finalize"
          >Finalize</Button
        >
        <Button class="button--green" size="large" ghost @click="claim"
          >Claim</Button
        >
        <div>Party: {{ partyContract }}</div>
        <div>Vault: {{ tokenVault }}</div>
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
import { C } from "../services/constants.ts"

export default Vue.extend({
  data() {
    return {
      invoker: {},
      nftContract: C.nftContract,
      tokenID: 1,
      error: "",
      partyContract: "",
      account: "",
      nftOwner: "",
      signature: "",
      tokenVault: "",
      vaultTokens: "",
      vaultShare: "",
    }
  },
  async mounted() {
    await this.connect()
  },
  methods: {
    async connect() {
      await window.ethereum.enable()
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      this.invoker = new Invoker(provider)
      const signer = provider.getSigner()
      this.account = await signer.getAddress()
      console.log("Invoker loaded:", this.invoker)
    },
    async update() {
      try {
        this.partyTokens = await this.invoker.partyTokens(this.partyContract)
      } catch (e) {
        console.log()
      }
      try {
        this.partyShare = await this.invoker.partyShare(
          this.partyContract,
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
    async fill() {
      try {
        await this.invoker.fill(
          this.partyContract,
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
    async place() {
      try {
        await this.invoker.place(this.partyContract)
      } catch (e) {
        this.error = e
        console.log(e)
      }
    },
    async contribute() {
      try {
        await this.invoker.contribute(this.partyContract, this.amount)
      } catch (e) {
        this.error = e
        console.log(e)
      }
    },
    async finalize() {
      try {
        this.tokenVault = await this.invoker.finalize(this.partyContract)
      } catch (e) {
        this.error = e
        console.log(e)
      }
    },
    async claim() {
      try {
        await this.invoker.claim(this.partyContract)
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
        this.partyContract = await this.invoker.startParty(
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
