export enum RaffleState {
    ACTIVE,
    FINISHED,
    COMPLETED
  }
  
  export interface RaffleInfo {
    raffleId: number;
    name: string;
    description: string;
    endTime: number;
    prizePool: string;
    state: RaffleState;
    winner: string;
    totalTickets: number;
    maxTickets: number;
    entropyNonce: number;
    lastEntropyRequestTime: number;
  }
  
  export interface Participant {
    userAddress: string;
    ticketCount: number;
  }
  
  export interface TokenInfo {
    address: string;
    symbol: string;
    decimals: number;
    balance?: string;
    allowance?: string;
  }
  
  export interface ChainInfo {
    id: number;
    name: string;
    connectorAddress?: string;
    tokens: TokenInfo[];
  }