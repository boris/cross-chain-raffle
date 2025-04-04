import { useState, useEffect } from 'react';
import { 
  useAccount, 
  useChainId,
  useReadContract,
  useWriteContract, 
  useSwitchChain
} from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { RaffleInfo } from '../types';
import { ZetaRaffleABI, RaffleConnectorABI, ERC20ABI } from '../contracts';
import { contractAddresses, chainNames } from '../contracts/addresses';
import { supportedChains, appConfig } from '../config';

interface BuyTicketModalProps {
  raffle: RaffleInfo;
  onClose: () => void;
  onSuccess: () => void;
}

export function BuyTicketModal({ raffle, onClose, onSuccess }: BuyTicketModalProps) {
  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  
  const [ticketCount, setTicketCount] = useState<string>('1');
  const [selectedChain, setSelectedChain] = useState<number>(chainId);
  const [isZetaChain, setIsZetaChain] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  
  // Get contract addresses
  const zetaRaffleAddress = (contractAddresses[appConfig.mainChain.id as keyof typeof contractAddresses] as any)?.ZetaRaffle as `0x${string}`;
  
  // Determine if user is on ZetaChain
  useEffect(() => {
    setIsZetaChain(chainId === appConfig.mainChain.id);
    // Default to current chain if supported
    if (supportedChains.some(chain => chain.id === chainId)) {
      setSelectedChain(chainId);
    }
  }, [chainId]);
  
  // Calculate total price
  const ticketPrice = parseEther(appConfig.ticketPrice);
  const totalPrice = BigInt(ticketCount || '1') * ticketPrice;
  
  // Get ZRC20 token for selected chain (if on ZetaChain)
  const zrc20Address = isZetaChain 
    ? (contractAddresses[appConfig.mainChain.id as keyof typeof contractAddresses] as any).ZRC20Tokens[selectedChain] as `0x${string}`
    : undefined;
  
  // Read token balance if on ZetaChain
  const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
    address: zrc20Address,
    abi: ERC20ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    chainId: appConfig.mainChain.id,
    query: {
      enabled: isZetaChain && !!address && !!zrc20Address,
    }
  });
  
  // Read token allowance if on ZetaChain
  const { data: tokenAllowance, refetch: refetchAllowance } = useReadContract({
    address: zrc20Address,
    abi: ERC20ABI,
    functionName: 'allowance',
    args: [
      address as `0x${string}`, 
      zetaRaffleAddress
    ],
    chainId: appConfig.mainChain.id,
    query: {
      enabled: isZetaChain && !!address && !!zrc20Address,
    }
  });
  
  // Check if approval is needed
  const needsApproval = tokenAllowance !== undefined && tokenAllowance < totalPrice;
  
  // Check if user has enough balance
  const hasEnoughBalance = tokenBalance !== undefined && tokenBalance >= totalPrice;
  
  // Handle approve token
  const { writeContractAsync: approveToken } = useWriteContract();
  
  // Handle buy tickets on ZetaChain
  const { writeContractAsync: buyTickets } = useWriteContract();
  
  // Handle token approval
  const handleApprove = async () => {
    if (!zrc20Address || !address) return;
    
    setIsApproving(true);
    setError(null);
    
    try {
      await approveToken({
        address: zrc20Address,
        abi: ERC20ABI,
        functionName: 'approve',
        args: [
          zetaRaffleAddress,
          totalPrice
        ],
      });
      
      // Refetch allowance after approval
      await refetchAllowance();
    } catch (err: any) {
      console.error('Error approving token:', err);
      setError(`Failed to approve tokens: ${err.message}`);
    } finally {
      setIsApproving(false);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);
    
    try {
      // First check if we're on ZetaChain
      if (isZetaChain) {
        if (!zrc20Address) {
          throw new Error("ZRC20 token address not found for the selected chain");
        }
        
        if (!hasEnoughBalance) {
          throw new Error(`Insufficient balance. You need at least ${formatEther(totalPrice)} tokens.`);
        }
        
        // First approve if needed
        if (needsApproval) {
          setIsApproving(true);
          
          await approveToken({
            address: zrc20Address,
            abi: ERC20ABI,
            functionName: 'approve',
            args: [
              zetaRaffleAddress,
              totalPrice
            ],
          });
          
          // Refetch allowance after approval
          await refetchAllowance();
          setIsApproving(false);
        }
        
        // Encode address as bytes for external address
        const encodedAddress = address as `0x${string}`;
        
        // Buy tickets
        await buyTickets({
          address: zetaRaffleAddress,
          abi: ZetaRaffleABI,
          functionName: 'buyTickets',
          args: [
            BigInt(raffle.raffleId),
            BigInt(ticketCount),
            BigInt(selectedChain),
            encodedAddress
          ],
        });
      } else {
        // If on external chain, need to switch to that chain first
        if (chainId !== selectedChain) {
          await switchChain({ chainId: selectedChain });
        }
        
        // Get connector contract address for the current chain
        const connectorAddress = (contractAddresses[selectedChain as keyof typeof contractAddresses] as any)?.RaffleConnector as `0x${string}`;
        
        if (!connectorAddress || connectorAddress.includes('DEPLOYED_CONNECTOR_ADDRESS')) {
          throw new Error(`Raffle connector not yet deployed on ${chainNames[selectedChain as keyof typeof chainNames] || 'this chain'}`);
        }
        
        const zetaTokenAddress = (contractAddresses[selectedChain as keyof typeof contractAddresses] as any)?.ZetaToken as `0x${string}`;
        
        if (!zetaTokenAddress) {
          throw new Error("Zeta token address not found for the current chain");
        }
        
        // Encode address as bytes
        const encodedAddress = address as `0x${string}`;
        
        // First approve tokens
        await approveToken({
          address: zetaTokenAddress,
          abi: ERC20ABI,
          functionName: 'approve',
          args: [connectorAddress, totalPrice],
        });
        
        // Then enter raffle
        await buyTickets({
          address: connectorAddress,
          abi: RaffleConnectorABI,
          functionName: 'enterRaffle',
          args: [
            BigInt(raffle.raffleId),
            zetaTokenAddress,
            totalPrice,
            BigInt(selectedChain),
            encodedAddress
          ],
        });
      }
      
      setSuccess(true);
      onSuccess();
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (err: any) {
      console.error('Error buying tickets:', err);
      setError(err.message || 'Failed to buy tickets. Please try again.');
    } finally {
      setProcessing(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Buy Tickets</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {success ? (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Success!</p>
            <p>Your tickets have been purchased.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Raffle
              </label>
              <input
                type="text"
                value={raffle.name}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Number of Tickets
              </label>
              <input
                type="number"
                min="1"
                value={ticketCount}
                onChange={(e) => setTicketCount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Total Price
              </label>
              <input
                type="text"
                value={`${formatEther(totalPrice)} Tokens`}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
              
              {isZetaChain && tokenBalance !== undefined && (
                <p className="mt-1 text-sm text-gray-600">
                  Your balance: {formatEther(tokenBalance)} Tokens
                  {!hasEnoughBalance && (
                    <span className="text-red-600 ml-2">
                      (Insufficient balance)
                    </span>
                  )}
                </p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Preferred Chain for Prizes
              </label>
              <select
                value={selectedChain}
                onChange={(e) => setSelectedChain(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                {supportedChains.map((chain) => (
                  <option key={chain.id} value={chain.id}>
                    {chainNames[chain.id as keyof typeof chainNames] || chain.name}
                  </option>
                ))}
              </select>
            </div>
            
            {isZetaChain && needsApproval && (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isApproving || !hasEnoughBalance}
                  className={`w-full py-2 px-4 rounded ${
                    isApproving 
                      ? 'bg-yellow-400 cursor-not-allowed' 
                      : !hasEnoughBalance 
                      ? 'bg-gray-300 cursor-not-allowed' 
                      : 'bg-yellow-500 hover:bg-yellow-600'
                  } text-white font-bold`}
                >
                  {isApproving ? 'Approving...' : 'Approve Tokens First'}
                </button>
                <p className="mt-1 text-sm text-gray-600">
                  You need to approve tokens before buying tickets.
                </p>
              </div>
            )}
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <p className="font-bold">Error</p>
                <p>{error}</p>
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
                disabled={processing || isApproving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded ${
                  (processing || isApproving || (isZetaChain && needsApproval) || (isZetaChain && !hasEnoughBalance)) 
                    ? 'opacity-50 cursor-not-allowed' 
                    : ''
                }`}
                disabled={processing || isApproving || (isZetaChain && needsApproval) || (isZetaChain && !hasEnoughBalance)}
              >
                {processing ? 'Processing...' : 'Buy Tickets'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}