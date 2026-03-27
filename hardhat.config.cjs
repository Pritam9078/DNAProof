require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "cancun",
    },
  },
  paths: {
    artifacts: './client/src/artifacts',
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    sepolia: {
      url: process.env.VITE_ETHEREUM_RPC_URL || "https://rpc.sepolia.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "YourApiKeyToken"
  },
  sourcify: {
    enabled: false
  }
};