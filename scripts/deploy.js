const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying contracts...");

  // Get network details
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId;
  console.log(`Deploying to chain ID: ${chainId}`);

  // Replace these addresses with the actual addresses for the network
  let pythEntropyAddress, zetaConnectorAddress;
  
  // Determine addresses based on network
  if (chainId === 7001) {
    // ZetaChain testnet
    pythEntropyAddress = "0xfD033a4e8bE3EE5F31F1Ed5bae5FA7f53a6bCb97"; // Pyth Entropy on Athens testnet
    zetaConnectorAddress = "0x239e96c8f17C85c30100AC26F635Ea15f23E9c67"; // ZetaConnector on Athens testnet
  } else if (chainId === 11155111) {
    // Ethereum Sepolia testnet
    zetaConnectorAddress = "0x7c125C1d515b8945841b3d5144a060115C58725F"; // ZetaConnector on Sepolia
  } else if (chainId === 97) {
    // BSC testnet
    zetaConnectorAddress = "0x0000000000000000000000000000000000000000"; // Replace with actual address
  } else if (chainId === 80001) {
    // Polygon Mumbai testnet
    zetaConnectorAddress = "0x0000000000000000000000000000000000000000"; // Replace with actual address
  } else {
    // Local or other chain
    console.log("Using placeholder addresses for local deployment");
    pythEntropyAddress = "0xfD033a4e8bE3EE5F31F1Ed5bae5FA7f53a6bCb97";
    zetaConnectorAddress = "0x239e96c8f17C85c30100AC26F635Ea15f23E9c67";
  }

  // Deploy ZetaRaffle contract (only on ZetaChain)
  let zetaRaffleAddress;
  if (chainId === 7001 || chainId === 31337) { // ZetaChain testnet or local hardhat
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying contracts with the account: ${deployer.address}`);
    
    const ZetaRaffle = await ethers.getContractFactory("ZetaRaffle");
    const zetaRaffle = await ZetaRaffle.deploy(
      pythEntropyAddress, 
      zetaConnectorAddress,
      deployer.address // owner address
    );
    
    await zetaRaffle.waitForDeployment();
    zetaRaffleAddress = await zetaRaffle.getAddress();
    console.log(`ZetaRaffle deployed to: ${zetaRaffleAddress}`);
    
    // Register some common ZRC20 tokens
    const zrc20Tokens = [
      { chainId: 97, symbol: "bBNB", address: "0x13A0c5930C028511Dc02665E7285134B6d11A5f4" }, // BSC ZRC20
      { chainId: 11155111, symbol: "sETH", address: "0x48f80608B672DC30DC7e3dbBd0343c5F02C738Eb" }, // Sepolia ZRC20
      { chainId: 80001, symbol: "mMATIC", address: "0x6f1c648eb474d6c14caa0bbbbb472c03dc191e28" }  // Mumbai ZRC20
    ];
    
    for (const token of zrc20Tokens) {
      console.log(`Registering ZRC20 for chain ${token.chainId} (${token.symbol}): ${token.address}`);
      await zetaRaffle.registerZRC20(token.chainId, token.address);
    }
  } else {
    // When not on ZetaChain, we need the already deployed ZetaRaffle address
    zetaRaffleAddress = "0x0000000000000000000000000000000000000000"; // Replace with actual address
    console.log(`Using existing ZetaRaffle at: ${zetaRaffleAddress}`);
  }

  // Deploy RaffleConnector contract (on other chains)
  if (chainId !== 7001) {
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying RaffleConnector with the account: ${deployer.address}`);
    
    // For testnet, this would be the ZetaToken on the specific chain
    // Replace with actual ZetaToken address for the chain
    const zetaTokenAddress = "0x0000000000000000000000000000000000000000";
    
    const RaffleConnector = await ethers.getContractFactory("RaffleConnector");
    const raffleConnector = await RaffleConnector.deploy(
      zetaConnectorAddress,
      zetaTokenAddress,
      zetaRaffleAddress,
      7001, // ZetaChain ID
      chainId, // Current chain ID
      deployer.address // owner address
    );
    
    await raffleConnector.waitForDeployment();
    const raffleConnectorAddress = await raffleConnector.getAddress();
    console.log(`RaffleConnector deployed to: ${raffleConnectorAddress}`);
    
    // Add some supported tokens
    // Replace with actual token addresses for the chain
    const supportedTokens = [
      zetaTokenAddress
    ];
    
    for (const token of supportedTokens) {
      console.log(`Adding supported token: ${token}`);
      await raffleConnector.addSupportedToken(token);
    }
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