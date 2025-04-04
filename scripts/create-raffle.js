const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  try {
    // Get the contract owner's address
    const [owner] = await ethers.getSigners();
    console.log(`Using owner account: ${owner.address}`);
    console.log(`Account balance: ${ethers.formatEther(await owner.provider.getBalance(owner.address))} ZETA`);

    // Get the deployed ZetaRaffle contract address from .env
    const raffleAddress = process.env.RAFFLE_CONTRACT_ADDRESS;
    
    if (!raffleAddress) {
      throw new Error("RAFFLE_CONTRACT_ADDRESS not set in .env file");
    }
    
    console.log(`Connecting to ZetaRaffle at ${raffleAddress}...`);
    
    // Check if the contract exists at this address (has code)
    const provider = ethers.provider;
    const code = await provider.getCode(raffleAddress);
    
    if (code === "0x") {
      console.error("No contract deployed at this address. Check if the address is correct.");
      return;
    }
    
    console.log("Contract code exists at the address.");
    
    // Get contract factory and connect to the deployed instance
    const ZetaRaffle = await ethers.getContractFactory("ZetaRaffle");
    const raffle = ZetaRaffle.attach(raffleAddress);
    
    // Check owner
    try {
      const contractOwner = await raffle.owner();
      console.log(`Contract owner: ${contractOwner}`);
      console.log(`Are you the owner? ${contractOwner.toLowerCase() === owner.address.toLowerCase()}`);
    } catch (error) {
      console.error("Basic owner() call failed, contract might not be compatible with ABI:");
      console.error(error.message);
      return;
    }
    
    // Check if ZRC20 tokens are registered
    console.log("Checking ZRC20 token registrations...");
    
    const chainIds = [97, 11155111, 80001]; // BSC, Sepolia, Mumbai
    
    for (const chainId of chainIds) {
      try {
        const zrc20Address = await raffle.chainToZRC20(chainId);
        console.log(`Chain ${chainId} ZRC20 address: ${zrc20Address}`);
        
        if (zrc20Address === "0x0000000000000000000000000000000000000000") {
          console.log(`WARNING: No ZRC20 registered for chain ${chainId}. This might cause issues.`);
          
          // Try to register ZRC20 tokens if missing
          if (chainId === 97) {
            console.log("Registering BSC ZRC20...");
            await raffle.registerZRC20(97, "0x13A0c5930C028511Dc02665E7285134B6d11A5f4");
          } else if (chainId === 11155111) {
            console.log("Registering Sepolia ZRC20...");
            await raffle.registerZRC20(11155111, "0x48f80608B672DC30DC7e3dbBd0343c5F02C738Eb");
          } else if (chainId === 80001) {
            console.log("Registering Mumbai ZRC20...");
            await raffle.registerZRC20(80001, "0x6f1c648eb474d6c14caa0bbbbb472c03dc191e28");
          }
        }
      } catch (error) {
        console.error(`Error checking ZRC20 for chain ${chainId}:`, error.message);
      }
    }
    
    // Try estimating gas for the function to see if it's valid
    console.log("\nEstimating gas for createRaffle...");
    try {
      const gasEstimate = await raffle.createRaffle.estimateGas(
        "First Raffle",
        "This is our first cross-chain raffle!",
        7 // Duration in days
      );
      console.log(`Estimated gas: ${gasEstimate.toString()}`);
      
      // If gas estimate is too high, that could indicate a problem
      if (gasEstimate.toString() > 5000000) {
        console.warn("WARNING: Gas estimate is very high! This may indicate a problem with the contract.");
      }
    } catch (error) {
      console.error("Gas estimation failed:", error.message);
      console.log("This suggests there's a fundamental issue with the function call.");
      console.log("Proceeding with manual gas limit anyway...");
    }
          
    console.log("\nCreating raffle...");
    // Try with different duration value
    const tx = await raffle.createRaffle(
      "First Raffle",
      "This is our first cross-chain raffle!",
      1, // Try shorter duration in days
      { gasLimit: 3000000 } // Very high gas limit for testing
    );
    
    console.log(`Transaction sent: ${tx.hash}`);
    console.log("Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("Raffle created successfully!");
    console.log("Gas used:", receipt.gasUsed.toString());
    
  } catch (error) {
    console.error("Error details:");
    if (error.data) {
      console.error("Error data:", error.data);
    }
    if (error.error) {
      console.error(`Code: ${error.error.code}`);
      console.error(`Message: ${error.error.message}`);
    }
    
    console.error("Full error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    process.exit(1);
  });