const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("=== ZetaRaffle Prize Claim Debugging Script ===\n");

  // Create a read-only provider
  const provider = new ethers.JsonRpcProvider("https://zetachain-athens-evm.blockpi.network/v1/rpc/public");
  
  // Get network details
  const network = await provider.getNetwork();
  console.log(`Connected to network: ${network.name || "unknown"} (Chain ID: ${network.chainId})`);

  // Get contract address from .env
  const contractAddress = process.env.RAFFLE_CONTRACT_ADDRESS;
  if (!contractAddress) {
    console.error("Error: No contract address provided. Set RAFFLE_CONTRACT_ADDRESS in .env file.");
    return;
  }
  console.log(`Using ZetaRaffle contract: ${contractAddress}\n`);

  // Get the contract ABI from artifacts
  const ZetaRaffleArtifact = require("../artifacts/contracts/ZetaRaffle.sol/ZetaRaffle.json");
  const contract = new ethers.Contract(contractAddress, ZetaRaffleArtifact.abi, provider);

  // Check contract balance
  const contractBalance = await provider.getBalance(contractAddress);
  console.log(`Contract balance: ${ethers.formatEther(contractBalance)} ZETA\n`);

  // Get all raffles
  console.log("Fetching all raffles...");
  const raffles = await contract.getAllRaffles();
  console.log(`Found ${raffles.length} raffles\n`);

  // Get raffle ID from .env
  const raffleId = process.env.RAFFLE_ID || 0;
  console.log(`Focusing on raffle ID: ${raffleId}`);

  if (raffleId >= raffles.length) {
    console.error(`Error: Raffle ID ${raffleId} does not exist. Max ID is ${raffles.length - 1}`);
    return;
  }

  // Get detailed info about the raffle
  const raffle = raffles[raffleId];
  
  // Format raffle state for better readability
  const states = ["ACTIVE", "FINISHED", "COMPLETED"];
  const stateString = states[raffle.state] || `Unknown (${raffle.state})`;
  
  console.log("\n=== Raffle Details ===");
  console.log(`Name: ${raffle.name}`);
  console.log(`Description: ${raffle.description}`);
  console.log(`End Time: ${new Date(Number(raffle.endTime) * 1000).toLocaleString()}`);
  console.log(`Prize Pool: ${ethers.formatEther(raffle.prizePool)} ZETA`);
  console.log(`State: ${stateString}`);
  console.log(`Winner: ${raffle.winner}`);
  console.log(`Total Tickets: ${raffle.totalTickets}`);
  console.log(`Max Tickets: ${raffle.maxTickets}`);

  // Check if winner address is valid
  if (raffle.winner === ethers.ZeroAddress) {
    console.log("\nNo winner has been selected yet for this raffle");
  } else {
    console.log(`\n=== Winner Analysis ===`);
    console.log(`Winner Address: ${raffle.winner}`);
    
    // Check winner's balance
    const winnerBalance = await provider.getBalance(raffle.winner);
    console.log(`Winner's current balance: ${ethers.formatEther(winnerBalance)} ZETA`);
    
    // Get constants from contract
    const operatorFeePercentage = await contract.OPERATOR_FEE_PERCENTAGE();
    const totalPrizePool = ethers.formatEther(raffle.prizePool);
    const operatorFee = (Number(totalPrizePool) * Number(operatorFeePercentage)) / 100;
    const expectedPrize = Number(totalPrizePool) - operatorFee;
    
    console.log(`\nPrize Calculation:`);
    console.log(`Total Prize Pool: ${totalPrizePool} ZETA`);
    console.log(`Operator Fee (${operatorFeePercentage}%): ${operatorFee.toFixed(6)} ZETA`);
    console.log(`Expected Prize: ${expectedPrize.toFixed(6)} ZETA`);

    // Check if prize has been claimed
    const isPrizePoolEmpty = raffle.prizePool.toString() === "0";
    console.log(`\nPrize Status: ${isPrizePoolEmpty ? "Claimed" : "Not Claimed"}`);
    
    if (isPrizePoolEmpty) {
      console.log("Prize has been claimed, but may not have been received.");
      console.log("Possible issues:");
      console.log("1. Transaction may have failed after setting prize pool to 0");
      console.log("2. Recipient address may be a contract that doesn't accept ETH");
      console.log("3. There might be a discrepancy in transaction confirmation");
    }
  }

  // Look for PrizeClaimed events
  console.log("\n=== Event Logs ===");
  console.log("Searching for PrizeClaimed events (in last 1000 blocks)...");

  // Initialize prizeClaimed as an empty array by default
  let prizeClaimed = [];

  try {
    // Get the current block number
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 1000); // Last 1000 blocks
    
    const filter = {
      address: contractAddress,
      topics: [
        ethers.id("PrizeClaimed(uint256,address,uint256)"),
        ethers.toBeHex(raffleId, 32)
      ],
      fromBlock: fromBlock,
      toBlock: "latest"
    };
    
    const events = await provider.getLogs(filter);
    prizeClaimed = events.map(log => {
      const parsed = contract.interface.parseLog(log);
      return {
        transactionHash: log.transactionHash,
        blockNumber: log.blockNumber,
        winner: parsed.args[1],
        amount: parsed.args[2]
      };
    });
    
    if (prizeClaimed.length === 0) {
      console.log(`No PrizeClaimed events found in the last 1000 blocks`);
      console.log("This suggests the prize has not been recently claimed on-chain");
      console.log("You may need to check earlier blocks or verify through the explorer");
    } else {
      console.log(`Found ${prizeClaimed.length} PrizeClaimed events:`);
      
      for (const event of prizeClaimed) {
        console.log(`\nEvent in transaction: ${event.transactionHash}`);
        console.log(`Block number: ${event.blockNumber}`);
        console.log(`Winner: ${event.winner}`);
        console.log(`Amount: ${ethers.formatEther(event.amount)} ZETA`);
        
        try {
          // Get transaction details
          const tx = await provider.getTransaction(event.transactionHash);
          console.log(`\nTransaction Details:`);
          console.log(`From: ${tx.from}`);
          console.log(`To: ${tx.to}`);
          console.log(`Value: ${ethers.formatEther(tx.value || 0n)} ZETA`);
          
          // Get transaction receipt to check status
          const receipt = await provider.getTransactionReceipt(event.transactionHash);
          console.log(`\nTransaction Status: ${receipt.status === 1 ? "Success" : "Failed"}`);
          console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
        } catch (err) {
          console.log(`Error fetching transaction details: ${err.message}`);
        }
        
        // Check if there were any internal transactions (transfers)
        console.log(`\nLook for this transaction on ZetaChain Explorer to see internal transfers:`);
        console.log(`https://explorer.zetachain.com/tx/${event.transactionHash}`);
      }
    }
  } catch (error) {
    console.log(`Error getting logs: ${error.message}`);
    console.log("Please check transaction in explorer: https://explorer.zetachain.com/address/" + contractAddress);
  }

  // Check owner
  const owner = await contract.owner();
  console.log("\n=== Contract Owner ===");
  console.log(`Owner Address: ${owner}`);

  console.log("\n=== Debugging Recommendations ===");
  if (raffle.state.toString() === "2" && raffle.prizePool.toString() === "0" && prizeClaimed.length === 0) {
    console.log("- The raffle shows as COMPLETED with prize pool = 0, but no PrizeClaimed events were found.");
    console.log("- This suggests the prize distribution transaction may have failed silently or events weren't properly emitted.");
    console.log("- Check the contract's claimPrize function implementation for any issues with the transfer logic.");
  } else if (raffle.state.toString() === "2" && raffle.prizePool.toString() !== "0") {
    console.log("- The raffle is COMPLETED but the prize pool is not empty.");
    console.log("- The prize has not been claimed yet. The owner should call claimPrize function.");
  } else if (prizeClaimed.length > 0 && raffle.prizePool.toString() !== "0") {
    console.log("- PrizeClaimed events exist but the prize pool is not empty.");
    console.log("- This suggests a potential inconsistency in the contract state or event emission.");
  } else if (prizeClaimed.length > 0 && raffle.prizePool.toString() === "0") {
    console.log("- The prize was claimed successfully according to both events and contract state.");
    console.log("- If the winner hasn't received funds, check if their address is a contract that may not handle native token transfers properly.");
    console.log("- Or there may be an issue with the wallet displaying the funds.");
  }

  console.log("\n=== Script Completed ===");
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 