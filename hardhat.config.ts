import { HardhatUserConfig } from "hardhat/config";
// import "@nomicfoundation/hardhat-toolbox";
import hardhatIgnitionViemPlugin from "@nomicfoundation/hardhat-ignition-viem";
import hardhatVerify from "@nomicfoundation/hardhat-verify";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.VITE_PRIVATE_KEY;
const accounts = PRIVATE_KEY ? [PRIVATE_KEY] : [];
const ETHERSCAN_KEY = process.env.VITE_ETHERSCAN_KEY || "";
const BSC_TESTNET_RPC = "https://data-seed-prebsc-1-s1.binance.org:8545/";
const BSC_MAINNET_RPC =
  "https://bnb-mainnet.g.alchemy.com/v2/_mR5dI4COTt7AYmEMN3ha";
const BASE_SEPOLIA_RPC = "https://sepolia.base.org";
const BASE_RPC = `https://mainnet.base.org`;

const config: HardhatUserConfig = {
  plugins: [hardhatVerify, hardhatIgnitionViemPlugin],
  solidity: {
    version: "0.8.28",
    settings: {
      viaIR: true, // Kept this as per your Truffle config
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Hardhat's equivalent to "development" is the built-in "hardhat" network
    // But if you want to connect to a running Ganache/Local node:
    localhost: {
      url: "http://127.0.0.1:7545",
      type: "http",
    },
    bscTestnet: {
      url: BSC_TESTNET_RPC,
      chainId: 97,
      accounts,
      type: "http",
    },
    baseSepolia: {
      url: BASE_SEPOLIA_RPC,
      chainId: 84532,
      accounts,
      type: "http",
    },
    baseMainnet: {
      url: BASE_RPC,
      chainId: 8453,
      accounts,
      type: "http",
    },
    bscMainnet: {
      url: BSC_MAINNET_RPC,
      chainId: 56,
      accounts,
      type: "http",
    },
  },
  verify: {
    etherscan: {
      apiKey: ETHERSCAN_KEY,
    },
    blockscout: {
      enabled: false,
    },
    sourcify: {
      enabled: false,
    },
  },
};

export default config;
