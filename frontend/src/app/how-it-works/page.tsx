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
                <li>Automatic winner selection when all tickets are sold</li>
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
                  Purchase tickets using ZETA tokens. Each ticket costs 0.1 ZETA. The more tickets you buy, the higher your chances of winning.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-indigo-100 text-indigo-800 font-bold">4</div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Winner Selection</h3>
                <p className="mt-1 text-gray-600">
                  The winner is selected automatically in one of two ways:
                </p>
                <ul className="list-disc list-inside mt-2 text-gray-600">
                  <li>When all available tickets are sold, the drawing process begins immediately</li>
                  <li>If the raffle duration ends before all tickets are sold, the raffle owner will initiate the drawing</li>
                </ul>
                <p className="mt-1 text-gray-600">
                  In both cases, Pyth Entropy (a Verifiable Random Function) ensures a provably fair selection process.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-indigo-100 text-indigo-800 font-bold">5</div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Claiming Prizes</h3>
                <p className="mt-1 text-gray-600">
                  Once a winner is selected, the raffle operator will distribute the prize. If you win, you'll see a "You Won!" message on the raffle card, and the prize will be sent directly to your wallet.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Raffle Lifecycle</h2>
          
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-0 sm:left-1/2 h-full w-0.5 bg-indigo-200 transform -translate-x-1/2"></div>
            
            {/* Timeline items */}
            <div className="space-y-12">
              <div className="relative flex items-center justify-between flex-col sm:flex-row">
                <div className="flex-1 sm:pr-8">
                  <div className="bg-indigo-50 p-4 rounded shadow">
                    <h3 className="text-lg font-medium text-indigo-800">Creation</h3>
                    <p className="text-gray-600 mt-2">
                      A new raffle is created with a name, description, duration, and maximum number of tickets (optional).
                    </p>
                  </div>
                </div>
                <div className="absolute left-0 sm:left-1/2 -translate-x-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold">1</div>
                <div className="flex-1 sm:pl-8 mt-4 sm:mt-0">
                  <div className="font-semibold text-indigo-700">ACTIVE State</div>
                </div>
              </div>
              
              <div className="relative flex items-center justify-between flex-col sm:flex-row">
                <div className="flex-1 sm:pr-8">
                  <div className="bg-indigo-50 p-4 rounded shadow">
                    <h3 className="text-lg font-medium text-indigo-800">Ticket Purchases</h3>
                    <p className="text-gray-600 mt-2">
                      Users buy tickets to enter the raffle. Each purchase increases the prize pool.
                    </p>
                  </div>
                </div>
                <div className="absolute left-0 sm:left-1/2 -translate-x-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold">2</div>
                <div className="flex-1 sm:pl-8 mt-4 sm:mt-0">
                  <div className="font-semibold text-indigo-700">ACTIVE State</div>
                </div>
              </div>
              
              <div className="relative flex items-center justify-between flex-col sm:flex-row">
                <div className="flex-1 sm:pr-8">
                  <div className="bg-indigo-50 p-4 rounded shadow">
                    <h3 className="text-lg font-medium text-indigo-800">Raffle Closes</h3>
                    <p className="text-gray-600 mt-2">
                      The raffle closes either when all tickets are sold or when the time duration expires. If all tickets are sold, the drawing process begins automatically.
                    </p>
                  </div>
                </div>
                <div className="absolute left-0 sm:left-1/2 -translate-x-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold">3</div>
                <div className="flex-1 sm:pl-8 mt-4 sm:mt-0">
                  <div className="font-semibold text-indigo-700">FINISHED State</div>
                </div>
              </div>
              
              <div className="relative flex items-center justify-between flex-col sm:flex-row">
                <div className="flex-1 sm:pr-8">
                  <div className="bg-indigo-50 p-4 rounded shadow">
                    <h3 className="text-lg font-medium text-indigo-800">Winner Selection</h3>
                    <p className="text-gray-600 mt-2">
                      Pyth Entropy (VRF) is used to randomly select a winner from all ticket holders. This happens automatically when all tickets are sold, or it can be triggered by the raffle owner.
                    </p>
                  </div>
                </div>
                <div className="absolute left-0 sm:left-1/2 -translate-x-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold">4</div>
                <div className="flex-1 sm:pl-8 mt-4 sm:mt-0">
                  <div className="font-semibold text-indigo-700">COMPLETED State</div>
                </div>
              </div>
              
              <div className="relative flex items-center justify-between flex-col sm:flex-row">
                <div className="flex-1 sm:pr-8">
                  <div className="bg-indigo-50 p-4 rounded shadow">
                    <h3 className="text-lg font-medium text-indigo-800">Prize Distribution</h3>
                    <p className="text-gray-600 mt-2">
                      The raffle owner distributes the prize to the winner. 5% of the prize pool goes to the platform as a fee, and the winner receives the rest.
                    </p>
                  </div>
                </div>
                <div className="absolute left-0 sm:left-1/2 -translate-x-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold">5</div>
                <div className="flex-1 sm:pl-8 mt-4 sm:mt-0">
                  <div className="font-semibold text-indigo-700">COMPLETED State (Prize Claimed)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}