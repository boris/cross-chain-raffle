'use client';

import React, { PropsWithChildren, useEffect, useState } from 'react';

// Simple placeholder provider without wallet connections
export function Providers({ children }: PropsWithChildren) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use a simple wrapper during SSR
  if (!mounted) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="min-h-screen">
      {/* Regular app content */}
      {children}
      
      {/* Wallet connection button - to be implemented later */}
      <div className="fixed bottom-4 right-4">
        <button 
          onClick={() => alert('Wallet connection will be implemented later')}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Connect Wallet
        </button>
      </div>
    </div>
  );
} 