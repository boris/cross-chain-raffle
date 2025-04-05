export enum RaffleState {
  OPEN,
  DRAWING,
  COMPLETE
}

export interface RaffleInfo {
  raffleId: number;
  name: string;
  description: string;
  endTime: number;
  prizePool: string;
  state: RaffleState;
  winner: string;
  winnerChainId: number;
  winnerExternalAddress: string;
  totalTickets: number;
  entropyNonce: number;
  lastEntropyRequestTime: number;
  maxParticipants?: number; // Added for V2 compatibility
}

export interface Participant {
  zetaAddress: string;
  chainId: number;
  externalAddress: string;
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