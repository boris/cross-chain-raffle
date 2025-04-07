require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // ZetaChain testnet
    "zetachain-testnet": {
      url: "https://zetachain-athens-evm.blockpi.network/v1/rpc/public",
      accounts: [PRIVATE_KEY],
      chainId: 7001,
      gasPrice: "auto",
      gas: "auto",
      timeout: 60000,
      ens: false  // Boris: Disable ENS resolution
    },
    // ZetaChain mainnet
    "zetachain-mainnet": {
      url: "https://zetachain-evm.blockpi.network/v1/rpc/public",
      accounts: [PRIVATE_KEY],
      chainId: 7000,
      gasPrice: "auto",
      gas: "auto",
      timeout: 60000,
      ens: false  // Boris: Disable ENS resolution
    },
    // Boris: Are networks below really required?
    // Ethereum Sepolia testnet
    "sepolia": {
      url: "https://eth-sepolia.public.blastapi.io",
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
    },
    // BSC testnet
    "bsc-testnet": {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      accounts: [PRIVATE_KEY],
      chainId: 97,
    },
    // Polygon Mumbai testnet
    "mumbai": {
      url: "https://polygon-mumbai.blockpi.network/v1/rpc/public",
      accounts: [PRIVATE_KEY],
      chainId: 80001,
    },
    // Hardhat local network
    "hardhat": {
      mining: {
        auto: true,
        interval: 5000,
      },
    },
  },
  etherscan: {
    apiKey: {
      zetachain: process.env.ZETA_EXPLORER_API_KEY || "KTYQJ5MY1U6BTMDKRVJ44CNWJ6YJAGJ2X3",
      sepolia: process.env.ETHERSCAN_API_KEY || "KTYQJ5MY1U6BTMDKRVJ44CNWJ6YJAGJ2X3",
      bscTestnet: process.env.BSCSCAN_API_KEY || "KTYQJ5MY1U6BTMDKRVJ44CNWJ6YJAGJ2X3",
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || "KTYQJ5MY1U6BTMDKRVJ44CNWJ6YJAGJ2X3",
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};