'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Header } from '../components/Header';
import { RaffleInfo, RaffleState, Participant } from '../types';
import { ZetaRaffleABI } from '../contracts/abis';
import { contractAddresses, chainNames } from '../contracts/addresses';
import { appConfig } from '../config';
import { formatTimestamp } from '../utils/date';
import dynamic from 'next/dynamic';

// TypeScript interface for window.ethereum
interface EthereumProvider {
  isMetaMask?: boolean;
  request: (args: {method: string; params?: any[]}) => Promise<any>;
  on: (event: string, callback: any) => void;
  removeListener: (event: string, callback: any) => void;
  removeAllListeners: (event: string) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export default function MyTickets() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [myRaffles, setMyRaffles] = useState<{raffle: RaffleInfo, participant: Participant}[]>([]);
  
  // Client state for wallet
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | undefined>(undefined);
  const [rafflesData, setRafflesData] = useState<RaffleInfo[] | undefined>(undefined);
  
  // Client-side only code
  useEffect(() => {
    setMounted(true);
    
    // Dynamically import and use wagmi on the client side only
    const loadWagmiData = async () => {
      try {
        const { useAccount, useChainId, useReadContract } = await import('wagmi');
        
        // Get account info
        const { address, isConnected } = useAccount();
        setIsConnected(!!isConnected);
        setAddress(address);
        
        // Get chain ID
        const chainId = useChainId();
        
        // If connected, load raffle data
        if (isConnected && address) {
          const raffleContract = {
            address: (contractAddresses[appConfig.mainChain.id as keyof typeof contractAddresses] as any)?.ZetaRaffle as `0x${string}`,
            abi: ZetaRaffleABI,
            functionName: 'getAllRaffles',
            chainId: appConfig.mainChain.id,
          };
          
          // Use window.ethereum to make the call directly
          if (window.ethereum) {
            try {
              const result = await window.ethereum.request({
                method: 'eth_call',
                params: [{
                  to: raffleContract.address,
                  data: '0x9979ef45' // Function selector for getAllRaffles()
                }, 'latest']
              });
              
              // This is a simplified approach - in reality you'd need to decode the return value
              // For now, let's assume we've parsed the data into RaffleInfo[] format
              // setRafflesData(decodedResult);
              
              // For testing, we'll just set an empty array
              setRafflesData([]);
              
              // Check user participation in raffles
              await checkUserParticipation([]);
            } catch (error) {
              console.error('Error fetching raffles:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error loading wagmi:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (typeof window !== 'undefined') {
      loadWagmiData();
    }
  }, []);
  
  // Function to check user participation in raffles
  const checkUserParticipation = async (raffles: RaffleInfo[]) => {
    if (!mounted || !address || !raffles) return;
    
    try {
      const participantData: {raffle: RaffleInfo, participant: Participant}[] = [];
      
      // Check each raffle for participation
      const raffleAddress = (contractAddresses[appConfig.mainChain.id as keyof typeof contractAddresses] as any)?.ZetaRaffle as `0x${string}`;
      
      // Check tickets for each raffle
      for (const raffle of raffles) {
        try {
          if (!window.ethereum) {
            console.error('Ethereum object not found. Please install a wallet like MetaMask.');
            continue;
          }
          
          const ticketCount = await window.ethereum.request({
            method: 'eth_call',
            params: [{
              to: raffleAddress,
              data: `0x${
                // Function selector for getTicketCount(uint256,address)
                '735e0e19' + 
                // Encode raffleId (32 bytes)
                raffle.raffleId.toString(16).padStart(64, '0') +
                // Encode address (32 bytes)
                address.slice(2).padStart(64, '0')
              }`
            }, 'latest']
          });
          
          const count = parseInt(ticketCount, 16);
          
          if (count > 0) {
            // Get participant details
            if (!window.ethereum) {
              console.error('Ethereum object not found. Please install a wallet like MetaMask.');
              continue;
            }
            
            const participant = await window.ethereum.request({
              method: 'eth_call',
              params: [{
                to: raffleAddress,
                data: `0x${
                  // Function selector for getParticipantInfo(uint256,address)
                  'c7ad9fef' + 
                  // Encode raffleId (32 bytes)
                  raffle.raffleId.toString(16).padStart(64, '0') +
                  // Encode address (32 bytes)
                  address.slice(2).padStart(64, '0')
                }`
              }, 'latest']
            });
            
            // For now, create a simple participant object
            const participantObj: Participant = {
              zetaAddress: address,
              chainId: 0,
              externalAddress: '',
              ticketCount: count
            };
            
            participantData.push({
              raffle,
              participant: participantObj
            });
          }
        } catch (error) {
          console.error(`Error checking tickets for raffle ${raffle.raffleId}:`, error);
        }
      }
      
      setMyRaffles(participantData);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Use a client-side only ConnectButton
  const ConnectButtonClient = dynamic(
    () => Promise.resolve(ConnectButton),
    { ssr: false }
  );
  
  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Tickets</h1>
          {mounted && <ConnectButtonClient />}
        </div>
        
        {!mounted ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : !isConnected ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Connect your wallet to view your tickets
            </h2>
            <ConnectButtonClient />
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : myRaffles.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium text-gray-700 mb-4">
              You haven't entered any raffles yet
            </h3>
            <p className="text-gray-500 mb-8">
              Head to the home page to find active raffles you can enter.
            </p>
            <a 
              href="/"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
            >
              Browse Raffles
            </a>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Raffle
                  </th>
                  <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tickets
                  </th>
                  <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Date
                  </th>
                  <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Result
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {myRaffles.map(({ raffle, participant }) => (
                  <tr key={raffle.raffleId.toString()}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{raffle.name}</div>
                      <div className="text-sm text-gray-500">{raffle.description.slice(0, 50)}...</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{participant.ticketCount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatTimestamp(raffle.endTime)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${raffle.state === RaffleState.OPEN 
                          ? 'bg-green-100 text-green-800' 
                          : raffle.state === RaffleState.DRAWING 
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {raffle.state === RaffleState.OPEN 
                          ? 'Open' 
                          : raffle.state === RaffleState.DRAWING 
                            ? 'Drawing'
                            : 'Complete'
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {raffle.state === RaffleState.COMPLETE ? (
                        raffle.winner.toLowerCase() === address?.toLowerCase() ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Winner!
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">Better luck next time</span>
                        )
                      ) : (
                        <span className="text-sm text-gray-500">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}