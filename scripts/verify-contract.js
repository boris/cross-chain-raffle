// Boris: This is just an utility script, can be deleted after the contract is verified
const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  try {
    const raffleAddress = process.env.RAFFLE_CONTRACT_ADDRESS;
    
    if (!raffleAddress) {
      throw new Error("RAFFLE_CONTRACT_ADDRESS not set in .env file");
    }
    
    console.log(`Checking contract at ${raffleAddress}...`);
    
    // Check if contract exists
    const provider = ethers.provider;
    const code = await provider.getCode(raffleAddress);
    
    if (code === "0x") {
      console.error("No contract deployed at this address!");
      return;
    }
    
    console.log(`Contract code length: ${code.length} bytes`);
    
    // Try basic functions to determine contract type
    try {
      // Check if it's an ERC20 token
      const erc20 = await ethers.getContractAt("IERC20", raffleAddress);
      const name = await erc20.name().catch(() => null);
      const symbol = await erc20.symbol().catch(() => null);
      
      if (name && symbol) {
        console.log(`This appears to be an ERC20 token: ${name} (${symbol})`);
        return;
      }
    } catch (error) {
      console.log("Not an ERC20 token");
    }
    
    // Try to access ZetaRaffle-specific functions
    try {
      const raffle = await ethers.getContractAt("ZetaRaffle", raffleAddress);
      
      // Try to get contract constants
      const ticketPrice = await raffle.TICKET_PRICE().catch(() => null);
      if (ticketPrice) {
        console.log(`TICKET_PRICE: ${ethers.formatEther(ticketPrice)} ZETA`);
      }
      
      const owner = await raffle.owner().catch(() => null);
      if (owner) {
        console.log(`Owner: ${owner}`);
      }
      
      const pythAddress = await raffle.pythEntropyAddress().catch(() => null);
      if (pythAddress) {
        console.log(`Pyth Entropy: ${pythAddress}`);
      }
      
      const zetaToken = await raffle.zetaToken().catch(() => null);
      if (zetaToken) {
        console.log(`ZETA Token: ${zetaToken}`);
      }
      
      if (ticketPrice && owner && pythAddress && zetaToken) {
        console.log("This is confirmed to be a ZetaRaffle contract with expected interfaces.");
      } else {
        console.log("Some ZetaRaffle functions are not available - might be a different version or contract.");
      }
      
    } catch (error) {
      console.error("Error accessing contract functions:", error.message);
      console.log("This doesn't appear to be a valid ZetaRaffle contract.");
    }
    
  } catch (error) {
    console.error("Error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 