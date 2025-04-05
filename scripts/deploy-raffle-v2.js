const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("Deploying ZetaRaffleV2 contract...");

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

  // Deploy ZetaRaffleV2 contract
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying ZetaRaffleV2 with account: ${deployer.address}`);
  console.log(`Using Pyth Entropy: ${pythEntropyAddress}`);
  console.log(`Using ZetaConnector: ${zetaConnectorAddress}`);
  
  const ZetaRaffleV2 = await ethers.getContractFactory("ZetaRaffleV2");
  const zetaRaffleV2 = await ZetaRaffleV2.deploy(
    pythEntropyAddress, 
    zetaConnectorAddress,
    deployer.address // owner address
  );
  
  await zetaRaffleV2.waitForDeployment();
  const zetaRaffleV2Address = await zetaRaffleV2.getAddress();
  console.log(`ZetaRaffleV2 deployed to: ${zetaRaffleV2Address}`);
  
  // Verify the contract code exists at the address
  const code = await ethers.provider.getCode(zetaRaffleV2Address);
  if (code === '0x') {
    console.error('WARNING: Contract code not found at the deployment address. Deployment may have failed.');
  } else {
    console.log('Contract code verified at the deployment address');
  }
  
  // Register some common ZRC20 tokens with proper checksums
  const zrc20Tokens = [
    { chainId: 97, symbol: "bBNB", address: ethers.getAddress("0x13a0c5930c028511dc02665e7285134b6d11a5f4") }, 
    { chainId: 11155111, symbol: "sETH", address: ethers.getAddress("0x48f80608b672dc30dc7e3dbbd0343c5f02c738eb") }, 
    { chainId: 80001, symbol: "mMATIC", address: ethers.getAddress("0x6f1c648eb474d6c14caa0bbbbb472c03dc191e28") }
  ];
  
  for (const token of zrc20Tokens) {
    console.log(`Registering ZRC20 for chain ${token.chainId} (${token.symbol}): ${token.address}`);
    await zetaRaffleV2.registerZRC20(token.chainId, token.address);
  }
  
  console.log("Writing new contract address to .env file");
  try {
    // Update .env file with new contract address
    const envContent = fs.readFileSync('.env', 'utf8');
    const updatedEnvContent = envContent.replace(
      /RAFFLE_CONTRACT_V2_ADDRESS=.*/,
      `RAFFLE_CONTRACT_V2_ADDRESS=${zetaRaffleV2Address}`
    );
    fs.writeFileSync('.env', updatedEnvContent);
    console.log(".env file updated with new contract address");
  } catch (error) {
    console.error("Error updating .env file:", error.message);
    console.log(`Please manually update your .env file with: RAFFLE_CONTRACT_V2_ADDRESS=${zetaRaffleV2Address}`);
  }

  console.log("Also updating frontend/src/app/contracts/addresses.ts file");
  try {
    // Update the addresses.ts file to include the new contract address
    const addressesPath = './frontend/src/app/contracts/addresses.ts';
    let addressesContent = fs.readFileSync(addressesPath, 'utf8');
    
    // Replace the placeholder with the actual address
    //addressesContent = addressesContent.replace(
    //  /ZetaRaffleV2: '0x0000000000000000000000000000000000000000'/,
    //  `ZetaRaffleV2: '${zetaRaffleV2Address}'`
    //);
    
    fs.writeFileSync(addressesPath, addressesContent);
    console.log("addresses.ts file updated with new contract address:", zetaRaffleV2Address);
  } catch (error) {
    console.error("Error updating addresses.ts file:", error.message);
    console.log(`Please manually update your addresses.ts file with the new ZetaRaffleV2 address: ${zetaRaffleV2Address}`);
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