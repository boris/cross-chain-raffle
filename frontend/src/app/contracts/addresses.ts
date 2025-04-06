// Define types for our contract addresses
type ChainId = 7001 | 11155111 | 97;

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
    // Boris: Needs to be updated if the contract is deployed again
    ZetaRaffle: '0xe4545008ca52E0cd2cFE751c6d53F4a384a41Cc7', // Updated contract with maxParticipants parameter
    // ZRC20 tokens
    ZRC20Tokens: {
      97: '0x7c8dDa80bbBE1254a7aACf3219EBe1481c6E01d7', // BSC ZRC20
      11155111: '0x05BA149A7bd6dC1F937fA9046A9e05C05f3b18b0', // Sepolia ZRC20
    }
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
  11155111: 'ETH',
  97: 'BNB'
};

export const chainNames: Record<ChainId, string> = {
  7001: 'ZetaChain Testnet',
  11155111: 'Ethereum Sepolia',
  97: 'BSC Testnet'
};

export const getChainColor = (chainId: number): string => {
  switch (chainId) {
    case 7001:
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
  return contractAddresses[7001] as ZetaChainContracts;
}

export function getExternalChainContracts(chainId: 11155111 | 97): ExternalChainContracts {
  return contractAddresses[chainId] as ExternalChainContracts;
}