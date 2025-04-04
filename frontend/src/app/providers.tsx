'use client';

import { PropsWithChildren, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supportedChains, appConfig } from './config';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

// Create a client-side only wrapper component
export function Providers({ children }: PropsWithChildren) {
  const [mounted, setMounted] = useState(false);
  const [client] = useState(() => new QueryClient());
  const [config] = useState(() => {
    // Get project ID from env or use a placeholder
    const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'placeholder_project_id';

    // Set up connectors
    const { connectors } = getDefaultWallets({
      appName: appConfig.appName,
      projectId,
    });

    // Create transports config for each chain
    const transports = Object.fromEntries(
      supportedChains.map(chain => [
        chain.id,
        http(chain.rpcUrls.default.http[0])
      ])
    );

    // Create wagmi config
    return createConfig({
      chains: supportedChains as [typeof supportedChains[0], ...typeof supportedChains],
      transports,
      connectors,
    });
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Empty div while rendering on server
  if (!mounted) {
    return <div>{children}</div>;
  }

  // Client-side only component
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={client}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}