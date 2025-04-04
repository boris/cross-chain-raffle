'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ConnectWallet } from './ConnectWallet';

export function Header() {
  const [mounted, setMounted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    // Check wallet connection status on client side only
    const checkConnection = async () => {
      try {
        const { useAccount } = await import('wagmi');
        const { isConnected } = useAccount();
        setIsConnected(isConnected);
      } catch (error) {
        console.error('Failed to check connection:', error);
      }
    };
    
    checkConnection();
    
    // Set up polling to check connection status
    const interval = setInterval(checkConnection, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-indigo-600">
          ZetaRaffle
        </Link>
        
        <div className="flex items-center">
          <nav className="flex space-x-6 mr-6">
            <Link href="/" className="text-gray-700 hover:text-indigo-600">
              Home
            </Link>
            {mounted && isConnected && (
              <Link href="/my-tickets" className="text-gray-700 hover:text-indigo-600">
                My Tickets
              </Link>
            )}
            <Link href="/how-it-works" className="text-gray-700 hover:text-indigo-600">
              How It Works
            </Link>
          </nav>
          
          <ConnectWallet />
        </div>
      </div>
    </header>
  );
}