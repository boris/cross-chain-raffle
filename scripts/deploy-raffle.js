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
  const pythEntropyAddress = ethers.getAddress("0x4374e5a8b9C22271E9EB878A2AA31DE97DF15DAF");   // pyth entropy address
  const zetaConnectorAddress = ethers.getAddress("0x239e96c8f17c85c30100ac26f635ea15f23e9c67"); // zeta_tesnet connector

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
  // This will create two TXs in the contract
  const zrc20Tokens = [
    { chainId: 97, symbol: "bBNB", address: ethers.getAddress("0x7c8dDa80bbBE1254a7aACf3219EBe1481c6E01d7") }, // USDC-BSC
    { chainId: 11155111, symbol: "sETH", address: ethers.getAddress("0x05BA149A7bd6dC1F937fA9046A9e05C05f3b18b0") }, // Sepolia sETH
    //{ chainId: 80001, symbol: "mMATIC", address: ethers.getAddress("0x6f1c648eb474d6c14caa0bbbbb472c03dc191e28") }
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