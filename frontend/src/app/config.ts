import { type Chain } from 'wagmi/chains';

// Define custom chains
export const zetachainAthens: Chain = {
  id: 7001,
  name: 'ZetaChain Athens Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'ZETA',
    symbol: 'ZETA',
  },
  rpcUrls: {
    public: { http: ['https://zetachain-athens-evm.blockpi.network/v1/rpc/public'] },
    default: { http: ['https://zetachain-athens-evm.blockpi.network/v1/rpc/public'] },
  },
  blockExplorers: {
    default: { name: 'ZetaScan', url: 'https://athens.explorer.zetachain.com' },
  },
  testnet: true,
};

// App config
export const appConfig = {
  appName: 'ZetaRaffle',
  mainChain: zetachainAthens,
  ticketPrice: "0.0001", // New lower ticket price in tokens
};

// Default provider options
export const defaultProviderOptions = {
  appName: appConfig.appName,
  alchemyId: process.env.NEXT_PUBLIC_ALCHEMY_ID || '',
};

// Chain configurations
export const supportedChains = [
  zetachainAthens,
  {
    id: 11155111,
    name: 'Sepolia',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: {
      public: { http: ['https://eth-sepolia.public.blastapi.io'] },
      default: { http: ['https://eth-sepolia.public.blastapi.io'] },
    },
    blockExplorers: {
      default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
    },
    testnet: true,
  },
  {
    id: 97,
    name: 'BNB Smart Chain Testnet',
    nativeCurrency: {
      name: 'Testnet BNB',
      symbol: 'tBNB',
      decimals: 18,
    },
    rpcUrls: {
      public: { http: ['https://data-seed-prebsc-1-s1.binance.org:8545'] },
      default: { http: ['https://data-seed-prebsc-1-s1.binance.org:8545'] },
    },
    blockExplorers: {
      default: { name: 'BscScan', url: 'https://testnet.bscscan.com' },
    },
    testnet: true,
  },
  {
    id: 80001,
    name: 'Polygon Mumbai',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    rpcUrls: {
      public: { http: ['https://polygon-mumbai.blockpi.network/v1/rpc/public'] },
      default: { http: ['https://polygon-mumbai.blockpi.network/v1/rpc/public'] },
    },
    blockExplorers: {
      default: { name: 'PolygonScan', url: 'https://mumbai.polygonscan.com' },
    },
    testnet: true,
  },
];