'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useChainId } from 'wagmi';
import { formatEther } from 'viem';
import { RaffleCard } from './RaffleCard';
import { RaffleInfo, RaffleState } from '../types';
import { ZetaRaffleABI } from '../contracts/abis';
import { contractAddresses } from '../contracts/addresses';
import { appConfig } from '../config';

export function RaffleList() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [raffles, setRaffles] = useState<RaffleInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get raffles
  const {
    data: rafflesData,
    isError,
    isLoading,
    refetch
  } = useReadContract({
    address: (contractAddresses[appConfig.mainChain.id as keyof typeof contractAddresses] as any)?.ZetaRaffle as `0x${string}`,
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
      setError('Failed to load raffles. Please check your connection and try again.');
      setLoading(false);
      return;
    }

    if (!isLoading && rafflesData) {
      setRaffles(rafflesData as RaffleInfo[]);
      setLoading(false);
      setError(null);
    }
  }, [isLoading, isError, rafflesData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
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

  // Filter active raffles (OPEN state) first, then completed ones
  const activeRaffles = raffles.filter(raffle => raffle.state === RaffleState.OPEN);
  const drawingRaffles = raffles.filter(raffle => raffle.state === RaffleState.DRAWING);
  const completedRaffles = raffles.filter(raffle => raffle.state === RaffleState.COMPLETE);

  // Sort by end time (ascending for active, descending for completed)
  activeRaffles.sort((a, b) => a.endTime - b.endTime);
  completedRaffles.sort((a, b) => b.endTime - a.endTime);

  // Combine sorted arrays
  const sortedRaffles = [...activeRaffles, ...drawingRaffles, ...completedRaffles];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sortedRaffles.map((raffle) => (
        <RaffleCard
          key={raffle.raffleId.toString()}
          raffle={raffle}
          userAddress={address || ''}
          onUpdate={() => refetch()}
        />
      ))}
    </div>
  );
}