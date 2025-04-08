# Cross-Chain Raffle Application

A decentralized raffle platform built on ZetaChain with cross-chain ticket purchasing capabilities.

## Overview

This project is a raffle platform that allows users to:

- Create raffles with customizable parameters (name, description, duration, max tickets)
- Purchase tickets with ZETA tokens
- Automatically draw winners using verifiable randomness
- Claim prizes through a secure withdrawal pattern
- Operate across multiple chains (ZetaChain, Ethereum, BSC)

The application consists of:
- Smart contracts built with Solidity deployed on ZetaChain
- Frontend built with Next.js, Tailwind CSS, and wagmi/RainbowKit

## Project Structure

```
cross-chain-raffle/
├── contracts/            # Solidity smart contracts
│   ├── contracts/        # Main contract files
│   ├── scripts/          # Deployment and interaction scripts
│   └── test/             # Contract test files
└── frontend/             # Next.js web application
    ├── public/           # Static assets
    └── src/              # Application source code
        ├── app/          # Next.js app directory
        └── components/   # React components
```

## Getting Started

### Prerequisites

- Node.js v16+ and npm/yarn
- MetaMask or compatible wallet
- Access to ZetaChain testnet or mainnet

## Smart Contract Development

### Setup Environment

1. Install dependencies:

```bash
cd contracts
npm install
```

2. Configure the environment variables:

Create a `.env` file in the contracts directory:

```
PRIVATE_KEY=your_private_key_here
ZETA_EXPLORER_API_KEY=your_api_key_here  # Optional for verification
```

### Deploy to ZetaChain Testnet

```bash
cd contracts
npx hardhat run scripts/deploy.js --network zetachain-testnet
```

### Deploy to ZetaChain Mainnet

```bash
cd contracts
npx hardhat run scripts/deploy.js --network zetachain-mainnet
```

### Verify Contracts

```bash
npx hardhat verify --network zetachain-testnet DEPLOYED_CONTRACT_ADDRESS
```

### Contract Interaction Scripts

The repository includes several helpful scripts for interacting with the contracts:

- `scripts/deploy.js` - Deploy the ZetaRaffle contract
- `scripts/create-raffle.js` - Create a new raffle
- `scripts/draw-winner.js` - Draw a winner for a raffle
- `scripts/process-prize.js` - Process prizes for a winner
- `scripts/withdraw.js` - Withdraw claimed prizes

### Contract Architecture

The core contracts are:

- `ZetaRaffle.sol` - Main raffle contract with all raffle logic and prize distribution
- `RaffleConnector.sol` - Connector for cross-chain interactions (on connected chains)

## Frontend Development

### Setup

1. Install dependencies:

```bash
cd frontend
npm install
```

2. Configure environment variables:

Create a `.env.local` file in the frontend directory:

```
# Environment (testnet or mainnet)
NEXT_PUBLIC_NETWORK_ENV=testnet
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### Switching Between Testnet and Mainnet

You can easily switch between ZetaChain testnet and mainnet environments:

1. Edit the `.env.local` file:
   ```
   NEXT_PUBLIC_NETWORK_ENV=mainnet  # or testnet
   ```

2. Restart the development server.

Alternatively, you can use environment variables when starting the server:

```bash
# For testnet
NEXT_PUBLIC_NETWORK_ENV=testnet npm run dev

# For mainnet
NEXT_PUBLIC_NETWORK_ENV=mainnet npm run dev
```

## Development Notes

- The frontend automatically detects contract addresses based on the configured network
- The withdrawal pattern is implemented to ensure secure prize distribution
- ZetaChain's omnichain functionality enables cross-chain ticket purchases
- Use the two-step prize claiming process (process then withdraw) for secure fund distribution

## Troubleshooting

### Contract Interactions

If you encounter issues with contract interactions:

1. Ensure you have sufficient ZETA for gas
2. Check that you're connected to the correct network in your wallet
3. Verify contract addresses in `frontend/src/app/contracts/addresses.ts`

### Frontend Issues

For frontend issues:

1. Check browser console for errors
2. Ensure `.env.local` is properly configured
3. Try clearing browser cache and restarting the development server

## License

This project is licensed under the MIT License.
