import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useChainId } from 'wagmi';
import { RaffleCard } from './RaffleCard';
import { RaffleInfo, RaffleState } from '../types';
import { ZetaRaffleABI } from '../contracts/abis';
import { contractAddresses } from '../contracts/addresses';
import { appConfig } from '../config';

interface RaffleListProps {
  userAddress?: string;
}

export function RaffleList({ userAddress }: RaffleListProps) {
  const { address } = useAccount();
  const chainId = useChainId();
  const [raffles, setRaffles] = useState<RaffleInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use the passed userAddress prop or fallback to the account from useAccount
  const effectiveAddress = userAddress || address || '';

  // Get the ZetaRaffle contract address
  const zetaRaffleAddress = (contractAddresses[appConfig.mainChain.id as keyof typeof contractAddresses] as any)?.ZetaRaffle as `0x${string}`;
  
  // Log the contract address to help with debugging
  console.log("Using ZetaRaffle contract:", zetaRaffleAddress);

  // Get raffles
  const {
    data: rafflesData,
    isError,
    isLoading,
    refetch
  } = useReadContract({
    address: zetaRaffleAddress,
    abi: ZetaRaffleABI,
    functionName: 'getAllRaffles',
    chainId: appConfig.mainChain.id,
  });

  // Refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  // Process raffles data
  useEffect(() => {
    if (isError) {
      console.error("Error fetching raffles:", isError);
      setError('Failed to load raffles. Please check your connection and try again.');
      setLoading(false);
      return;
    }

    if (!isLoading && rafflesData) {
      console.log("Received raffles data:", rafflesData);
      try {
        setRaffles(rafflesData as RaffleInfo[]);
        setLoading(false);
        setError(null);
      } catch (err) {
        console.error("Error processing raffles data:", err);
        setError('Failed to process raffle data. Please try again later.');
        setLoading(false);
      }
    }
  }, [isLoading, isError, rafflesData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="ml-4 text-indigo-500">Loading raffles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
        <button 
          onClick={() => {
            setLoading(true);
            setError(null);
            refetch();
          }}
          className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (raffles.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-medium text-gray-700">No raffles available yet</h3>
        <p className="text-gray-500 mt-2">Check back later or create a new raffle!</p>
      </div>
    );
  }

  // Filter raffles by state
  const activeRaffles = raffles.filter(raffle => raffle.state === RaffleState.ACTIVE);
  const finishedRaffles = raffles.filter(raffle => raffle.state === RaffleState.FINISHED);
  const completedRaffles = raffles.filter(raffle => raffle.state === RaffleState.COMPLETED);

  // Sort by end time (ascending for active, descending for completed)
  activeRaffles.sort((a, b) => Number(a.endTime) - Number(b.endTime));
  completedRaffles.sort((a, b) => Number(b.endTime) - Number(a.endTime));

  // Combine sorted arrays
  const sortedRaffles = [...activeRaffles, ...finishedRaffles, ...completedRaffles];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sortedRaffles.map((raffle) => (
        <RaffleCard 
          key={raffle.raffleId.toString()} 
          raffle={raffle} 
          userAddress={effectiveAddress} 
          onUpdate={refetch}
        />
      ))}
    </div>
  );
}