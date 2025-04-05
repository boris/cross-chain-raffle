import { useState } from 'react';
import { useWriteContract, useAccount, useChainId } from 'wagmi';
import { ZetaRaffleABI } from '../contracts/abis';
import { contractAddresses } from '../contracts/addresses';
import { appConfig } from '../config';

interface CreateRaffleModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateRaffleModal({ onClose, onSuccess }: CreateRaffleModalProps) {
  const { address } = useAccount();
  const chainId = useChainId();
  
  // Form fields
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [duration, setDuration] = useState<string>('7');
  const [minimumDeposit, setMinimumDeposit] = useState<string>('0.001');
  const [maxParticipants, setMaxParticipants] = useState<string>('100');
  const [useMaxParticipants, setUseMaxParticipants] = useState<boolean>(true);
  
  // UI state
  const [processing, setProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  // Check if we're on ZetaChain
  const isZetaChain = chainId === appConfig.mainChain.id;
  
  // Get contract address
  const contractAddress = isZetaChain 
    ? (contractAddresses[appConfig.mainChain.id as keyof typeof contractAddresses] as any)?.ZetaRaffle as `0x${string}`
    : undefined;
  
  // Write contract function
  const { writeContractAsync: createRaffle } = useWriteContract();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);
    
    if (!isZetaChain) {
      setError('You must be connected to ZetaChain to create a raffle');
      setProcessing(false);
      return;
    }
    
    if (!contractAddress) {
      setError('Contract address not found for the current network');
      setProcessing(false);
      return;
    }
    
    try {
      // Calculate max participants value
      const maxParticipantsValue = useMaxParticipants 
        ? BigInt(parseInt(maxParticipants) || 100) 
        : BigInt(0); // 0 means unlimited
      
      console.log(`Creating raffle with name: ${name}, description: ${description}, duration: ${duration}`);
      console.log(`Max participants: ${maxParticipantsValue}`);
      
      // Call contract with all parameters including maxParticipants
      await createRaffle({
        address: contractAddress,
        abi: ZetaRaffleABI,
        functionName: 'createRaffle',
        args: [name, description, BigInt(duration), maxParticipantsValue],
      });
      
      setSuccess(true);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (err: any) {
      console.error('Error creating raffle:', err);
      setError(err.message || 'Failed to create raffle. Please try again.');
    } finally {
      setProcessing(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Create New Raffle</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {!isZetaChain ? (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Wrong Network</p>
            <p>You must be connected to ZetaChain to create a raffle.</p>
          </div>
        ) : success ? (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Success!</p>
            <p>Your raffle has been created.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Raffle Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                maxLength={50}
                placeholder="Summer Giveaway"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                rows={3}
                maxLength={200}
                placeholder="Enter a description for your raffle"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Duration (Days)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
              <p className="text-sm text-gray-500 mt-1">How long the raffle will be open for entries</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Minimum Deposit (Tokens)
              </label>
              <input
                type="number"
                min="0.001"
                value={minimumDeposit}
                onChange={(e) => setMinimumDeposit(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
              <p className="text-sm text-gray-500 mt-1">
                <span className="text-yellow-600">Note:</span> Currently fixed at 10 tokens per ticket in the contract
              </p>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="useMaxParticipants"
                  checked={useMaxParticipants}
                  onChange={(e) => setUseMaxParticipants(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="useMaxParticipants" className="ml-2 block text-gray-700 text-sm font-bold">
                  Limit participants
                </label>
              </div>
              
              <input
                type="number"
                min="2"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md ${!useMaxParticipants ? 'bg-gray-100' : ''}`}
                disabled={!useMaxParticipants}
                required={useMaxParticipants}
              />
              <p className="text-sm text-gray-500 mt-1">
                {useMaxParticipants 
                  ? `Maximum number of participants: ${maxParticipants}`
                  : "No limit on participants"}
              </p>
            </div>
            
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
                disabled={processing}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
                disabled={processing || !isZetaChain}
              >
                {processing ? 'Processing...' : 'Create Raffle'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}