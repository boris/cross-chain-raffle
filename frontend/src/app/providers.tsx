'use client';

import { PropsWithChildren, useEffect, useState } from 'react';
import { supportedChains, defaultProviderOptions } from './config';

// Create a client-side only wrapper component
export function Providers({ children }: PropsWithChildren) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Empty div while rendering on server
  if (!mounted) {
    return <div>{children}</div>;
  }

  // Client-side only component
  return <ClientProviders>{children}</ClientProviders>;
}

// This component only renders on the client
function ClientProviders({ children }: PropsWithChildren) {
  // Dynamic imports to avoid SSR issues with browser APIs
  const { WagmiConfig, createConfig } = require('wagmi');
  const { http } = require('viem');
  const { RainbowKitProvider, getDefaultWallets } = require('@rainbow-me/rainbowkit');
  require('@rainbow-me/rainbowkit/styles.css');

  // Get project ID from env or use a placeholder
  const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

  // Set up connectors - explicitly exclude Safe connector
  const { connectors } = getDefaultWallets({
    appName: defaultProviderOptions.appName,
    projectId,
    wallets: [], // Use default wallets without Safe
  });

  // Create transports config for each chain
  const transports = Object.fromEntries(
    supportedChains.map(chain => [
      chain.id,
      http(chain.rpcUrls.default.http[0])
    ])
  );

  // Create wagmi config
  const wagmiConfig = createConfig({
    chains: supportedChains as [typeof supportedChains[0], ...typeof supportedChains],
    transports,
    connectors,
  });

  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider>
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
}