'use client';

import { useState } from 'react';
// Boris: Are these components below correct?
import { Header } from './components/Header';
import { appConfig } from './config';

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Placeholder for wallet connection
  const handleConnectWallet = () => {
    alert('Wallet connection feature will be implemented later');
    // Temporary for UI testing
    setIsConnected(true);
  };

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Available Raffles</h1>
          <div className="flex space-x-4">
            <button
              onClick={handleConnectWallet}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              {isConnected ? 'Connected' : 'Connect Wallet'}
            </button>
            
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Placeholder for raffle listings */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-2">Sample Raffle</h3>
              <p className="text-gray-600 mb-4">This is a placeholder for raffle listings.</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Prize: 100 ZETA</span>
                <button className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded text-sm">
                  Enter
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Connect your wallet to view and participate in raffles
            </h2>
            <p className="text-gray-500 mb-8">
              ZetaRaffle allows you to enter raffles using tokens from any supported blockchain.
            </p>
            <button
              onClick={handleConnectWallet}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Connect Wallet
            </button>
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Create New Raffle</h2>
            <p className="text-gray-700 mb-6">Raffle creation form will be implemented later.</p>
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}