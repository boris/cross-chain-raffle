import { useState } from 'react';
import { formatEther } from 'viem';
import { useReadContract, useWriteContract } from 'wagmi';
import { RaffleInfo, RaffleState } from '../types';
import { formatDistanceToNow } from '../utils/date';
import { BuyTicketModal } from './BuyTicketModal';
import { ZetaRaffleABI } from '../contracts/abis';
import { contractAddresses, chainNames } from '../contracts/addresses';
import { appConfig } from '../config';

interface RaffleCardProps {
  raffle: RaffleInfo;
  userAddress: string;
  onUpdate: () => void;
}

export function RaffleCard({ raffle, userAddress, onUpdate }: RaffleCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  
  // Get ZetaRaffle contract address
  const zetaRaffleAddress = (contractAddresses[appConfig.mainChain.id as keyof typeof contractAddresses] as any)?.ZetaRaffle as `0x${string}`;

  // Get user's ticket count
  const { data: ticketCount } = useReadContract({
    address: zetaRaffleAddress,
    abi: ZetaRaffleABI,
    functionName: 'getTicketCount',
    args: [BigInt(raffle.raffleId), userAddress as `0x${string}`],
    chainId: appConfig.mainChain.id,
    query: {
      enabled: !!userAddress,
    }
  });

  // Setup claim prize function
  const { writeContractAsync: claimPrize } = useWriteContract();

  // Format prize pool (making sure we handle it as a BigInt)
  const formattedPrizePool = typeof raffle.prizePool === 'string' 
    ? formatEther(BigInt(raffle.prizePool)) 
    : formatEther(raffle.prizePool as unknown as bigint);
  
  // Get time remaining
  const now = Math.floor(Date.now() / 1000);
  const endTime = typeof raffle.endTime === 'string' ? parseInt(raffle.endTime) : Number(raffle.endTime);
  const isEnded = now > endTime;
  const timeRemaining = isEnded 
    ? 'Ended' 
    : formatDistanceToNow(new Date(endTime * 1000));
  
  // Get status badge
  const getBadge = () => {
    switch (raffle.state) {
      case RaffleState.OPEN:
        return isEnded 
          ? <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">Ready to Draw</span>
          : <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Open</span>;
      case RaffleState.DRAWING:
        return <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">Drawing...</span>;
      case RaffleState.COMPLETE:
        return <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">Completed</span>;
      default:
        return null;
    }
  };

  // Handle claim prize
  const handleClaimPrize = async () => {
    if (!userAddress) return;
    
    setIsClaiming(true);
    setClaimError(null);
    
    try {
      await claimPrize({
        address: zetaRaffleAddress,
        abi: ZetaRaffleABI,
        functionName: 'claimPrize',
        args: [BigInt(raffle.raffleId)],
      });
      
      // Update the raffle list
      onUpdate();
    } catch (err: any) {
      console.error('Error claiming prize:', err);
      setClaimError(err.message || 'Failed to claim prize. Please try again.');
    } finally {
      setIsClaiming(false);
    }
  };

  // Get action button
  const getActionButton = () => {
    if (!userAddress) {
      return null; // No wallet connected
    }

    if (raffle.state === RaffleState.OPEN && !isEnded) {
      return (
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg w-full"
        >
          Buy Tickets
        </button>
      );
    }

    if (raffle.state === RaffleState.COMPLETE && raffle.winner.toLowerCase() === userAddress.toLowerCase()) {
      return (
        <button
          onClick={handleClaimPrize}
          disabled={isClaiming}
          className={`${
            isClaiming ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'
          } text-white font-bold py-2 px-4 rounded-lg w-full`}
        >
          {isClaiming ? 'Claiming...' : 'Claim Prize'}
        </button>
      );
    }

    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-gray-800">{raffle.name}</h3>
          {getBadge()}
        </div>
        
        <p className="text-gray-600 mb-4 h-12 overflow-hidden text-sm">
          {raffle.description}
        </p>
        
        <div className="space-y-2 mb-4">
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Prize Pool:</span>
            <span className="font-medium">{parseFloat(formattedPrizePool).toFixed(2)} Tokens</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Entries:</span>
            <span className="font-medium">{raffle.totalTickets.toString()}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Your Tickets:</span>
            <span className="font-medium">{ticketCount ? Number(ticketCount) : '0'}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Time Remaining:</span>
            <span className="font-medium">{timeRemaining}</span>
          </div>
          
          {raffle.state === RaffleState.COMPLETE && (
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Winner:</span>
              <span className="font-medium truncate ml-2 w-24">
                {raffle.winner.slice(0, 6)}...{raffle.winner.slice(-4)}
              </span>
            </div>
          )}
        </div>
        
        {claimError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4 text-sm">
            {claimError}
          </div>
        )}
        
        {getActionButton()}
      </div>

      {isModalOpen && (
        <BuyTicketModal
          raffle={raffle}
          onClose={() => setIsModalOpen(false)}
          onSuccess={onUpdate}
        />
      )}
    </div>
  );
}