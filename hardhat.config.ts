import * as dotenv from "dotenv"
dotenv.config({ path: __dirname + "/.env" })

import "@nomiclabs/hardhat-web3"
import "@typechain/hardhat"
import "@nomiclabs/hardhat-ethers"
import "@nomiclabs/hardhat-waffle"
import "@nomiclabs/hardhat-etherscan"
import "solidity-coverage"
import "hardhat-abi-exporter"
import "@openzeppelin/hardhat-upgrades"

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
export default {
  solidity: {
    compilers: [
      {
        version: "0.8.5",
        settings: {
          optimizer: {
            enabled: true,
            runs: 999999,
          },
        },
      },
      {
        version: "0.7.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 999999,
          },
        },
      },
      {
        version: "0.7.5",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1337,
          },
          outputSelection: {
            "*": {
              "*": ["evm.bytecode", "evm.deployedBytecode", "abi"],
            },
          },
          metadata: {
            useLiteralContent: true,
          },
          libraries: {},
        },
      },
      {
        version: "0.4.11",
        settings: {
          optimizer: {
            enabled: true,
            runs: 999999,
          },
        },
      },
      {
        version: "0.6.8",
        settings: {
          optimizer: {
            enabled: true,
            runs: 999999,
          },
        },
      },
    ],
  },
  abiExporter: {
    clear: true,
    flat: true,
    spacing: 2,
  },
  mocha: {
    timeout: "10000000000",
  },
}
