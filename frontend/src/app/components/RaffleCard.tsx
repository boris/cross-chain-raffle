import { useState, useEffect } from 'react';
import { formatEther } from 'viem';
import { useReadContract, useWriteContract, useAccount } from 'wagmi';
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
  const [isDrawing, setIsDrawing] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [drawError, setDrawError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  
  // Get ZetaRaffle contract address
  const zetaRaffleAddress = (contractAddresses[appConfig.mainChain.id as keyof typeof contractAddresses] as any)?.ZetaRaffle as `0x${string}`;

  // Check if user is the contract owner
  const { data: contractOwner } = useReadContract({
    address: zetaRaffleAddress,
    abi: ZetaRaffleABI,
    functionName: 'owner',
    chainId: appConfig.mainChain.id,
  });

  // Update isOwner state when owner data is available
  useEffect(() => {
    if (contractOwner && userAddress) {
      setIsOwner((contractOwner as string).toLowerCase() === userAddress.toLowerCase());
    }
  }, [contractOwner, userAddress]);

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
  
  // Setup auto draw winner function
  const { writeContractAsync: autoDrawWinner } = useWriteContract();

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
      case RaffleState.ACTIVE:
        return isEnded 
          ? <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">Ending Soon</span>
          : <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Active</span>;
      case RaffleState.FINISHED:
        return <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">Drawing Winner...</span>;
      case RaffleState.COMPLETED:
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
  
  // Handle auto draw winner
  const handleAutoDrawWinner = async () => {
    if (!userAddress) return;
    
    setIsDrawing(true);
    setDrawError(null);
    
    try {
      await autoDrawWinner({
        address: zetaRaffleAddress,
        abi: ZetaRaffleABI,
        functionName: 'autoDrawWinner',
        args: [BigInt(raffle.raffleId)],
      });
      
      // Update the raffle list
      onUpdate();
    } catch (err: any) {
      console.error('Error drawing winner:', err);
      setDrawError(err.message || 'Failed to draw winner. Please try again.');
    } finally {
      setIsDrawing(false);
    }
  };

  // Get action button based on raffle state and user role
  const getActionButton = () => {
    // If user is not connected, show connect button
    if (!userAddress) {
      return (
        <button className="w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600 transition" disabled>
          Connect Wallet
        </button>
      );
    }

    // If raffle is completed and user is the owner (only owner can claim prizes now)
    if (raffle.state === RaffleState.COMPLETED && isOwner) {
      if (Number(raffle.prizePool) === 0) {
        return (
          <button className="w-full bg-green-500 text-white py-2 rounded opacity-50 cursor-not-allowed" disabled>
            Prize Claimed
          </button>
        );
      }
      
      return (
        <button 
          onClick={handleClaimPrize} 
          disabled={isClaiming}
          className={`w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition ${isClaiming ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isClaiming ? 'Claiming...' : 'Distribute Prize'}
        </button>
      );
    }

    // If raffle is active, show buy tickets button
    if (raffle.state === RaffleState.ACTIVE && !isEnded) {
      // Check if all tickets are sold (maxTickets > 0 indicates max tickets is set)
      if (raffle.maxTickets > 0 && raffle.totalTickets >= raffle.maxTickets) {
        return (
          <button className="w-full bg-gray-500 text-white py-2 rounded opacity-50 cursor-not-allowed" disabled>
            Sold Out
          </button>
        );
      }
      
      return (
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-indigo-500 text-white py-2 rounded hover:bg-indigo-600 transition"
        >
          Buy Tickets
        </button>
      );
    }
    
    // If raffle is in FINISHED state and user is owner, show the draw button
    if (raffle.state === RaffleState.FINISHED && isOwner) {
      return (
        <button 
          onClick={handleAutoDrawWinner}
          disabled={isDrawing}
          className={`w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition ${isDrawing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isDrawing ? 'Drawing...' : 'Draw Winner Now'}
        </button>
      );
    }
    
    // For all other states, show status
    return (
      <button className="w-full bg-gray-500 text-white py-2 rounded opacity-50 cursor-not-allowed" disabled>
        {raffle.state === RaffleState.ACTIVE && isEnded ? 'Waiting for Draw' : 
         raffle.state === RaffleState.FINISHED ? 'Drawing Pending' : 
         raffle.state === RaffleState.COMPLETED && raffle.winner.toLowerCase() === userAddress.toLowerCase() ? 'You Won!' : 'Completed'}
      </button>
    );
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
          
          {raffle.state === RaffleState.COMPLETED && (
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
        
        {drawError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4 text-sm">
            {drawError}
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