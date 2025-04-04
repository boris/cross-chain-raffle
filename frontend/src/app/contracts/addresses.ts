// Define types for our contract addresses
type ChainId = 7001 | 11155111 | 97 | 80001;

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
    ZetaRaffle: '0x31569c7d6232cbd335526f52160893ccc557faca',
    // ZRC20 tokens
    ZRC20Tokens: {
      97: '0x13A0c5930C028511Dc02665E7285134B6d11A5f4', // BSC ZRC20
      11155111: '0x48f80608B672DC30DC7e3dbBd0343c5F02C738Eb', // Sepolia ZRC20
      80001: '0x6f1c648eb474d6c14caa0bbbbb472c03dc191e28', // Mumbai ZRC20
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
  },
  // Polygon Mumbai testnet
  80001: {
    RaffleConnector: '0x_DEPLOYED_CONNECTOR_ADDRESS_MUMBAI',
    ZetaToken: '0x0000000000000000000000000000000000000000' // Replace with actual address
  }
};

export const nativeTokenSymbols: Record<ChainId, string> = {
  7001: 'ZETA',
  11155111: 'ETH',
  97: 'BNB',
  80001: 'MATIC'
};

export const chainNames: Record<ChainId, string> = {
  7001: 'ZetaChain Testnet',
  11155111: 'Ethereum Sepolia',
  97: 'BSC Testnet',
  80001: 'Polygon Mumbai'
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

export function getExternalChainContracts(chainId: 11155111 | 97 | 80001): ExternalChainContracts {
  return contractAddresses[chainId] as ExternalChainContracts;
}