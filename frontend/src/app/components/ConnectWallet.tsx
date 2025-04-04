'use client';

import { useEffect, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface ConnectWalletProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
}

export function ConnectWallet({ onConnect, onDisconnect }: ConnectWalletProps) {
  const [mounted, setMounted] = useState(false);

  // Initialize wallet state on client-side only
  useEffect(() => {
    setMounted(true);
    
    const initWallet = async () => {
      try {
        const { useAccount } = await import('wagmi');
        const { address, isConnected } = useAccount();
        
        // Call onConnect if connected
        if (isConnected && address && onConnect) {
          onConnect(address);
        } else if (!isConnected && onDisconnect) {
          onDisconnect();
        }
      } catch (error) {
        console.error('Failed to initialize wallet:', error);
      }
    };
    
    initWallet();
    
    // Poll for changes in wallet state
    const interval = setInterval(initWallet, 1000);
    return () => clearInterval(interval);
  }, [onConnect, onDisconnect]);

  if (!mounted) return null;

  // The rest of your ConnectButton code...
  return (
    <ConnectButton />
  );
}