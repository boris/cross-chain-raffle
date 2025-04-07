const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("Deploying ZetaRaffle contract...");

  // Get network details
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId;
  console.log(`Deploying to chain ID: ${chainId}`);

  /*
  if (chainId !== 7001n) {
    console.error("This script is intended to be used only on ZetaChain testnet (chainId 7001)");
    return;
  }
  */

  // ZetaChain testnet addresses - let ethers handle the checksums
  const pythEntropyAddress = ethers.getAddress("0x36825bf3Fbdf5a29E2d5148bfe7Dcf7B5639e320");   // pyth entropy address for testnet
  const zetaTokenAddress = ethers.getAddress("0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf");     // ZETA token on testnet
  
  // Deploy ZetaRaffle contract
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying ZetaRaffle with account: ${deployer.address}`);
  console.log(`Using Pyth Entropy: ${pythEntropyAddress}`);
  console.log(`Using ZETA Token: ${zetaTokenAddress}`);
  
  const ZetaRaffle = await ethers.getContractFactory("ZetaRaffle");
  const zetaRaffle = await ZetaRaffle.deploy(
    pythEntropyAddress, 
    zetaTokenAddress,
    deployer.address // owner address
  );
  
  await zetaRaffle.waitForDeployment();
  const zetaRaffleAddress = await zetaRaffle.getAddress();
  console.log(`ZetaRaffle deployed to: ${zetaRaffleAddress}`);
  
  console.log("Writing new contract address to .env file");
  try {
    // Update .env file with new contract address
    const envContent = fs.readFileSync('.env', 'utf8');
    const updatedEnvContent = envContent.replace(
      /RAFFLE_CONTRACT_ADDRESS=.*/,
      `RAFFLE_CONTRACT_ADDRESS=${zetaRaffleAddress}`
    );
    fs.writeFileSync('.env', updatedEnvContent);
    console.log(`>>> .env file updated with new contract address: ${zetaRaffleAddress}`);
  } catch (error) {
    console.error("Error updating .env file:", error.message);
    console.log(`Please manually update your .env file with: RAFFLE_CONTRACT_ADDRESS=${zetaRaffleAddress}`);
  }

  console.log("Deployment complete!");
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 