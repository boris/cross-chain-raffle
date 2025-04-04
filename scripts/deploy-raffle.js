const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("Deploying ZetaRaffle contract...");

  // Get network details
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId;
  console.log(`Deploying to chain ID: ${chainId}`);

  if (chainId !== 7001n) {
    console.error("This script is intended to be used only on ZetaChain testnet (chainId 7001)");
    return;
  }

  // ZetaChain testnet addresses - let ethers handle the checksums
  const pythEntropyAddress = ethers.getAddress("0xfd033a4e8be3ee5f31f1ed5bae5fa7f53a6bcb97"); 
  const zetaConnectorAddress = ethers.getAddress("0x239e96c8f17c85c30100ac26f635ea15f23e9c67"); 

  // Deploy ZetaRaffle contract
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying ZetaRaffle with account: ${deployer.address}`);
  console.log(`Using Pyth Entropy: ${pythEntropyAddress}`);
  console.log(`Using ZetaConnector: ${zetaConnectorAddress}`);
  
  const ZetaRaffle = await ethers.getContractFactory("ZetaRaffle");
  const zetaRaffle = await ZetaRaffle.deploy(
    pythEntropyAddress, 
    zetaConnectorAddress,
    deployer.address // owner address
  );
  
  await zetaRaffle.waitForDeployment();
  const zetaRaffleAddress = await zetaRaffle.getAddress();
  console.log(`ZetaRaffle deployed to: ${zetaRaffleAddress}`);
  
  // Register some common ZRC20 tokens with proper checksums
  const zrc20Tokens = [
    { chainId: 97, symbol: "bBNB", address: ethers.getAddress("0x13a0c5930c028511dc02665e7285134b6d11a5f4") }, 
    { chainId: 11155111, symbol: "sETH", address: ethers.getAddress("0x48f80608b672dc30dc7e3dbbd0343c5f02c738eb") }, 
    { chainId: 80001, symbol: "mMATIC", address: ethers.getAddress("0x6f1c648eb474d6c14caa0bbbbb472c03dc191e28") }
  ];
  
  for (const token of zrc20Tokens) {
    console.log(`Registering ZRC20 for chain ${token.chainId} (${token.symbol}): ${token.address}`);
    await zetaRaffle.registerZRC20(token.chainId, token.address);
  }
  
  console.log("Writing new contract address to .env file");
  try {
    // Update .env file with new contract address
    const envContent = fs.readFileSync('.env', 'utf8');
    const updatedEnvContent = envContent.replace(
      /RAFFLE_CONTRACT_ADDRESS=.*/,
      `RAFFLE_CONTRACT_ADDRESS=${zetaRaffleAddress}`
    );
    fs.writeFileSync('.env', updatedEnvContent);
    console.log(".env file updated with new contract address");
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