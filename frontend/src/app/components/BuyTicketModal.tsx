import { useState, useEffect } from 'react';
import { 
  useAccount, 
  useChainId,
  useWriteContract, 
  useSwitchChain
} from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { RaffleInfo } from '../types';
import { ZetaRaffleABI } from '../contracts/abis';
import { contractAddresses } from '../contracts/addresses';
import { appConfig } from '../config';

interface BuyTicketModalProps {
  raffle: RaffleInfo;
  onClose: () => void;
  onSuccess: () => void;
}

export function BuyTicketModal({ raffle, onClose, onSuccess }: BuyTicketModalProps) {
  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  
  const [ticketCount, setTicketCount] = useState<string>('1');
  const [processing, setProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  // Check if we're on ZetaChain
  const isZetaChain = chainId === appConfig.mainChain.id;
  
  // Get contract address
  const zetaRaffleAddress = (contractAddresses[appConfig.mainChain.id as keyof typeof contractAddresses] as any)?.ZetaRaffle as `0x${string}`;
  
  // Calculate total price
  const ticketPrice = parseEther('0.1'); // 0.1 ZETA per ticket
  const totalPrice = BigInt(ticketCount || '1') * ticketPrice;
  
  // Handle buy tickets
  const { writeContractAsync: buyTickets } = useWriteContract();
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);
    
    try {
      // First check if we're on ZetaChain
      if (!isZetaChain) {
        // Try to switch to ZetaChain
        try {
          await switchChain({ chainId: appConfig.mainChain.id });
          setError("Please retry after switching to ZetaChain");
          setProcessing(false);
          return;
        } catch (switchErr) {
          setError("You must be on ZetaChain to buy tickets");
          setProcessing(false);
          return;
        }
      }
      
      // Calculate total price
      const totalPrice = BigInt(ticketCount || '1') * ticketPrice;
      
      // Check ticket availability
      if (raffle.maxTickets > 0) {
        const availableTickets = raffle.maxTickets - raffle.totalTickets;
        if (Number(ticketCount) > availableTickets) {
          setError(`Only ${availableTickets} tickets available`);
          setProcessing(false);
          return;
        }
      }
      
      // Buy tickets with ZETA directly
      await buyTickets({
        address: zetaRaffleAddress,
        abi: ZetaRaffleABI,
        functionName: 'buyTickets',
        args: [
          BigInt(raffle.raffleId),
          BigInt(ticketCount)
        ],
        value: totalPrice,
      });
      
      setSuccess(true);
      onSuccess();
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (err: any) {
      console.error('Error buying tickets:', err);
      setError(err.message || 'Failed to buy tickets. Please try again.');
    } finally {
      setProcessing(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Buy Tickets</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {!isZetaChain ? (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Wrong Network</p>
            <p>You must be connected to ZetaChain to buy tickets.</p>
            <button
              onClick={() => switchChain({ chainId: appConfig.mainChain.id })}
              className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-2 rounded text-sm"
            >
              Switch to ZetaChain
            </button>
          </div>
        ) : success ? (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Success!</p>
            <p>Your tickets have been purchased.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Raffle
              </label>
              <input
                type="text"
                value={raffle.name}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Number of Tickets
              </label>
              <input
                type="number"
                min="1"
                value={ticketCount}
                onChange={(e) => setTicketCount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
              {raffle.maxTickets > 0 && (
                <p className="mt-1 text-sm text-gray-600">
                  Available tickets: {raffle.maxTickets - raffle.totalTickets}
                </p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Total Price
              </label>
              <input
                type="text"
                value={`${formatEther(totalPrice)} ZETA`}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
              <p className="mt-1 text-sm text-gray-600">
                Ticket price: 0.1 ZETA per ticket
              </p>
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <p className="font-bold">Error</p>
                <p>{error}</p>
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded ${
                  processing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={processing || !isZetaChain}
              >
                {processing ? 'Processing...' : 'Buy Tickets'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}