// Define types for our contract addresses
type ChainId = 7001 | 7000 | 11155111 | 97;

type ZetaChainContracts = {
  ZetaRaffle: string;
  ZRC20Tokens: {
    [key: number]: string;
  };
};

type ExternalChainContracts = {
  RaffleConnector: string;
  ZetaToken: string;
};

// Contract deployment addresses by chain
export const contractAddresses: Record<ChainId, ZetaChainContracts | ExternalChainContracts> = {
  // ZetaChain testnet
  7001: {
    // Updated to the latest deployed contract address
    ZetaRaffle: '0xc7d1a7046793df508bc9db1cb9ac3b94e105eda9', // Latest deployed contract
    // ZRC20 tokens
    ZRC20Tokens: {
      97: '0x05BA149A7bd6dC1F937fA9046A9e05C05f3b18b0', // BSC ZRC20
      11155111: '0x0cbe0dF132a6c6B4a2974Fa1b7Fb953CF0Cc798a', // Sepolia ZRC20
    }
  },
  // ZetaChain mainnet
  7000: {
    ZetaRaffle: '0x05e0A79C22d08394481d0B673ba94f7b0D69BA9D', // Latest deployed contract
    ZRC20Tokens: {}  // Empty object for now, add tokens when needed
  },
  // Ethereum Sepolia testnet
  11155111: {
    RaffleConnector: '0x_DEPLOYED_CONNECTOR_ADDRESS_SEPOLIA',
    ZetaToken: '0x0000000000000000000000000000000000000000' // Replace with actual address
  },
  // BSC testnet
  97: {
    RaffleConnector: '0x_DEPLOYED_CONNECTOR_ADDRESS_BSC',
    ZetaToken: '0x0000000000000000000000000000000000000000' // Replace with actual address
  }
};

export const nativeTokenSymbols: Record<ChainId, string> = {
  7001: 'ZETA',
  7000: 'ZETA',
  11155111: 'ETH',
  97: 'BNB'
};

export const chainNames: Record<ChainId, string> = {
  7001: 'ZetaChain Testnet',
  7000: 'ZetaChain Mainnet',
  11155111: 'Ethereum Sepolia',
  97: 'BSC Testnet'
};

export const getChainColor = (chainId: number): string => {
  switch (chainId) {
    case 7001:
      return '#6259CA'; // ZetaChain purple
    case 7000:
      return '#6259CA'; // ZetaChain purple
    case 11155111:
      return '#627EEA'; // Ethereum blue
    case 97:
      return '#F3BA2F'; // Binance yellow
    case 80001:
      return '#8247E5'; // Polygon purple
    default:
      return '#CCCCCC';
  }
};

// Helper function to type-safely access the contracts for a specific chain
export function getZetaChainContracts(): ZetaChainContracts {
  return contractAddresses[7000] as ZetaChainContracts;
}

export function getExternalChainContracts(chainId: 11155111 | 97): ExternalChainContracts {
  return contractAddresses[chainId] as ExternalChainContracts;
}