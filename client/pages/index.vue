<template>
  <div class="container">
    <div>
      <div>
        <div>
          NFT:
          <input v-model="nftContract" placeholder="ERC721 contract" />
        </div>
        <div>
          TokenID: <input v-model="tokenId" placeholder="amount Base" />
        </div>
        <Button class="button--green" size="large" ghost @click="startParty"
          >Deploy</Button
        >
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
      nftContract: "",
      tokenID: "",
    }
  },
  async mounted() {
    await this.connect()
    // await this.update()
  },
  methods: {
    async connect() {
      await window.ethereum.enable()
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      this.invoker = new Invoker()
      console.log("Invoker loaded:", this.invoker)
    },
    async startParty() {
      await invoker.startParty(nftContract, tokenID)
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
