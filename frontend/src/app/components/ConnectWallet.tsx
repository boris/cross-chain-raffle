'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface ConnectWalletProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
}

export function ConnectWallet({ onConnect, onDisconnect }: ConnectWalletProps) {
  const [mounted, setMounted] = useState(false);
  const [address, setAddress] = useState<string | undefined>(undefined);
  const [isConnected, setIsConnected] = useState(false);
  const [disconnect, setDisconnect] = useState<() => void>(() => {});

  // Initialize wallet state on client-side only
  useEffect(() => {
    setMounted(true);
    
    const initWallet = async () => {
      try {
        const { useAccount, useDisconnect } = await import('wagmi');
        const accountHook = useAccount();
        const disconnectHook = useDisconnect();
        
        setAddress(accountHook.address);
        setIsConnected(accountHook.isConnected);
        setDisconnect(() => disconnectHook.disconnect);
        
        // Call onConnect if connected
        if (accountHook.isConnected && accountHook.address && onConnect) {
          onConnect(accountHook.address);
        }
      } catch (error) {
        console.error('Failed to initialize wallet:', error);
      }
    };
    
    initWallet();
    
    // Poll for changes in wallet state
    const interval = setInterval(initWallet, 1000);
    return () => clearInterval(interval);
  }, [onConnect]);

  // Handle disconnect
  const handleDisconnect = () => {
    disconnect();
    if (onDisconnect) {
      onDisconnect();
    }
  };

  if (!mounted) return null;

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted: rainbowKitMounted,
      }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = rainbowKitMounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === 'authenticated');

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              'style': {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Wrong Network
                  </button>
                );
              }

              return (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={openChainModal}
                    className="flex items-center bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-sm"
                  >
                    {chain.hasIcon && (
                      <div className="mr-1">
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            className="w-4 h-4"
                          />
                        )}
                      </div>
                    )}
                    {chain.name}
                  </button>

                  <button
                    onClick={openAccountModal}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    {account.displayName}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}