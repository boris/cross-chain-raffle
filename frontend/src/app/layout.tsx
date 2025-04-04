import { Inter } from 'next/font/google';
import './globals.css';
// Use the original providers with WagmiProvider
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ZetaRaffle - Cross-chain Raffle System',
  description: 'A decentralized raffle system powered by ZetaChain',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}