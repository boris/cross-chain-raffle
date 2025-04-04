import { Header } from '../components/Header';
import { ZetaRaffleABI, contractAddresses, chainNames } from '../contracts';

export default function HowItWorks() {
  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">How ZetaRaffle Works</h1>
        
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Cross-Chain Raffles with ZetaChain</h2>
          <p className="text-gray-600 mb-4">
            ZetaRaffle is a decentralized raffle system built on ZetaChain that allows users to enter from multiple blockchains
            and win prizes that can be claimed on their preferred chain.
          </p>
          
          <div className="border-l-4 border-indigo-500 pl-4 py-2 mb-6">
            <p className="text-gray-700 italic">
              "ZetaChain's omnichain technology enables true cross-chain applications that can seamlessly connect assets and data
              across multiple blockchains."
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Key Features</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Enter raffles with tokens from any supported blockchain</li>
                <li>Transparent and fair winner selection using Pyth Entropy (VRF)</li>
                <li>Claim prizes on your preferred blockchain</li>
                <li>Low fees and fast transactions</li>
                <li>Fully decentralized and trustless</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Supported Chains</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>ZetaChain (main chain)</li>
                <li>Ethereum (Sepolia Testnet)</li>
                <li>BNB Smart Chain (Testnet)</li>
                <li>Polygon (Mumbai Testnet)</li>
                <li>More chains coming soon!</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">How to Participate</h2>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-indigo-100 text-indigo-800 font-bold">1</div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Connect Your Wallet</h3>
                <p className="mt-1 text-gray-600">
                  Connect your Web3 wallet (MetaMask, Trust Wallet, etc.) to ZetaRaffle. Supported chains include
                  ZetaChain, Ethereum, BSC, and Polygon.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-indigo-100 text-indigo-800 font-bold">2</div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Choose a Raffle</h3>
                <p className="mt-1 text-gray-600">
                  Browse the active raffles and select one you'd like to enter. Each raffle displays important
                  information like the prize pool, number of participants, and time remaining.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-indigo-100 text-indigo-800 font-bold">3</div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Buy Tickets</h3>
                <p className="mt-1 text-gray-600">
                  Purchase tickets using tokens from your current chain. The tokens will be bridged to ZetaChain
                  automatically. Each ticket costs 10 tokens.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-indigo-100 text-indigo-800 font-bold">4</div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Wait for the Draw</h3>
                <p className="mt-1 text-gray-600">
                  When the raffle ends, a winner will be selected randomly using Pyth Entropy, ZetaChain's
                  Verifiable Random Function (VRF). This ensures a transparent and provably fair selection process.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-indigo-100 text-indigo-800 font-bold">5</div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Claim Your Prize</h3>
                <p className="mt-1 text-gray-600">
                  If you win, you can claim your prize on your preferred blockchain. The tokens will be automatically
                  bridged from ZetaChain to your chosen chain.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Technical Details</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Cross-Chain Communication</h3>
              <p className="mt-1 text-gray-600">
                ZetaRaffle uses ZetaChain's cross-chain messaging to verify and transfer tokens between chains.
                When you buy tickets from an external chain, your tokens are "locked" and represented as ZRC20 tokens
                on ZetaChain.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900">Fair Randomness</h3>
              <p className="mt-1 text-gray-600">
                Winner selection is done using Pyth Entropy, a decentralized randomness service. This ensures
                that the selection process is transparent, fair, and cannot be manipulated by anyone, including
                the raffle creators.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900">Prize Distribution</h3>
              <p className="mt-1 text-gray-600">
                95% of the prize pool goes to the winner, while 5% is kept as a protocol fee to maintain the
                platform. When claiming prizes, users can choose which chain they want to receive their winnings on.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900">Creating Raffles</h3>
              <p className="mt-1 text-gray-600">
                Currently, only the platform owner can create new raffles. This is to ensure the quality and
                legitimacy of raffles. Future versions will allow anyone to create raffles with different
                parameters and token types.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}