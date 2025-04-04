'use client';

import { useState, useEffect } from 'react';

export function useWalletConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<`0x${string}` | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkConnection = async () => {
      try {
        // Check if ethereum object exists
        if (window.ethereum) {
          // Get connected accounts
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          
          if (accounts && accounts.length > 0) {
            setIsConnected(true);
            setWalletAddress(accounts[0] as `0x${string}`);
          } else {
            setIsConnected(false);
            setWalletAddress(undefined);
          }
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
        setIsConnected(false);
        setWalletAddress(undefined);
      } finally {
        setIsLoading(false);
      }
    };

    // Check immediately
    checkConnection();
    
    // Set up event listeners for wallet changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setIsConnected(true);
          setWalletAddress(accounts[0] as `0x${string}`);
        } else {
          setIsConnected(false);
          setWalletAddress(undefined);
        }
      });
      
      window.ethereum.on('chainChanged', () => {
        checkConnection();
      });
      
      window.ethereum.on('connect', () => {
        checkConnection();
      });
      
      window.ethereum.on('disconnect', () => {
        setIsConnected(false);
        setWalletAddress(undefined);
      });
    }
    
    // Poll as a backup
    const interval = setInterval(checkConnection, 3000);
    return () => {
      clearInterval(interval);
      // Clean up event listeners
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
        window.ethereum.removeAllListeners('connect');
        window.ethereum.removeAllListeners('disconnect');
      }
    };
  }, []);

  return { isConnected, walletAddress, isLoading };
}