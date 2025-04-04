'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Header } from './components/Header';
import { ConnectWallet } from './components/ConnectWallet';
import { RaffleList } from './components/RaffleList';
import { CreateRaffleModal } from './components/CreateRaffleModal';

export default function Home() {
  // Client-side rendering check
  const [mounted, setMounted] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Client-side only state
  const [isConnected, setIsConnected] = useState(false);
  const [userAddress, setUserAddress] = useState<`0x${string}` | undefined>(undefined);
  
  // Hook into wagmi only on the client side
  useEffect(() => {
    setMounted(true);
    
    // Dynamically import and use wagmi
    const getWalletInfo = async () => {
      try {
        const { useAccount } = await import('wagmi');
        const { address, isConnected } = useAccount();
        setIsConnected(isConnected);
        setUserAddress(address);
      } catch (error) {
        console.error('Failed to load wallet info:', error);
      }
    };
    
    getWalletInfo();
    
    // Set up polling to check connection status
    const interval = setInterval(getWalletInfo, 2000);
    return () => clearInterval(interval);
  }, []);
  
  // During SSR or before client-side hydration, show a loading state
  if (!mounted) {
    return (
      <main className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Available Raffles</h1>
          <div className="flex space-x-4">
            <ConnectWallet />
            
            {isConnected && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
              >
                Create Raffle
              </button>
            )}
          </div>
        </div>

        {isConnected ? (
          <RaffleList userAddress={userAddress} />
        ) : (
          <div className="text-center py-20">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Connect your wallet to view and participate in raffles
            </h2>
            <p className="text-gray-500 mb-8">
              ZetaRaffle allows you to enter raffles using tokens from any supported blockchain.
            </p>
            <ConnectWallet />
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <CreateRaffleModal onClose={() => setIsCreateModalOpen(false)} />
      )}
    </main>
  );
}