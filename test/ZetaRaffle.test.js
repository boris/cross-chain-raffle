const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ZetaRaffle", function () {
  let zetaRaffle;
  let mockPythEntropy;
  let mockZetaConnector;
  let mockZRC20;
  let owner;
  let user1;
  let user2;
  let user3;
  
  const TICKET_PRICE = ethers.parseEther("10");
  
  beforeEach(async function () {
    // Deploy mock contracts
    [owner, user1, user2, user3] = await ethers.getSigners();
    
    // Deploy mock ZRC20 token
    const MockToken = await ethers.getContractFactory("MockZRC20");
    mockZRC20 = await MockToken.deploy("Mock ZRC20", "MOCK", 18);
    await mockZRC20.waitForDeployment();
    
    // Deploy mock Pyth Entropy
    const MockPythEntropy = await ethers.getContractFactory("MockPythEntropy");
    mockPythEntropy = await MockPythEntropy.deploy();
    await mockPythEntropy.waitForDeployment();
    
    // Deploy mock ZetaConnector
    const MockZetaConnector = await ethers.getContractFactory("MockZetaConnector");
    mockZetaConnector = await MockZetaConnector.deploy();
    await mockZetaConnector.waitForDeployment();
    
    // Deploy ZetaRaffle
    const ZetaRaffle = await ethers.getContractFactory("ZetaRaffle");
    zetaRaffle = await ZetaRaffle.deploy(
      await mockPythEntropy.getAddress(),
      await mockZetaConnector.getAddress(),
      owner.address
    );
    await zetaRaffle.waitForDeployment();
    
    // Register mock ZRC20
    await zetaRaffle.registerZRC20(31337, await mockZRC20.getAddress()); // Local chain ID
    
    // Mint tokens for users
    await mockZRC20.mint(user1.address, ethers.parseEther("1000"));
    await mockZRC20.mint(user2.address, ethers.parseEther("1000"));
    await mockZRC20.mint(user3.address, ethers.parseEther("1000"));
    
    // Approve ZetaRaffle to spend tokens
    await mockZRC20.connect(user1).approve(await zetaRaffle.getAddress(), ethers.parseEther("1000"));
    await mockZRC20.connect(user2).approve(await zetaRaffle.getAddress(), ethers.parseEther("1000"));
    await mockZRC20.connect(user3).approve(await zetaRaffle.getAddress(), ethers.parseEther("1000"));
  });
  
  describe("Raffle Creation", function () {
    it("Should create a new raffle", async function () {
      await expect(zetaRaffle.createRaffle("Test Raffle", "Test Description", 7))
        .to.emit(zetaRaffle, "RaffleCreated")
        .withArgs(0, "Test Raffle", ethers.anyValue);
      
      const raffle = await zetaRaffle.raffles(0);
      expect(raffle.name).to.equal("Test Raffle");
      expect(raffle.description).to.equal("Test Description");
      expect(raffle.state).to.equal(0); // OPEN
    });
    
    it("Only owner can create a raffle", async function () {
      await expect(zetaRaffle.connect(user1).createRaffle("Test Raffle", "Test Description", 7))
        .to.be.revertedWithCustomError(zetaRaffle, "OwnableUnauthorizedAccount");
    });
  });
  
  describe("Ticket Purchasing", function () {
    beforeEach(async function () {
      await zetaRaffle.createRaffle("Test Raffle", "Test Description", 7);
    });
    
    it("Should allow users to buy tickets", async function () {
      const externalAddress = ethers.toUtf8Bytes("0x1234567890123456789012345678901234567890");
      
      await expect(zetaRaffle.connect(user1).buyTickets(0, 1, 31337, externalAddress))
        .to.emit(zetaRaffle, "TicketPurchased")
        .withArgs(0, user1.address, 31337, externalAddress, 1, 1);
      
      const participant = await zetaRaffle.getParticipantInfo(0, user1.address);
      expect(participant.ticketCount).to.equal(1);
      
      const raffle = await zetaRaffle.raffles(0);
      expect(raffle.totalTickets).to.equal(1);
      expect(raffle.prizePool).to.equal(TICKET_PRICE);
    });
    
    it("Should allow multiple ticket purchases", async function () {
      const externalAddress = ethers.toUtf8Bytes("0x1234567890123456789012345678901234567890");
      
      await zetaRaffle.connect(user1).buyTickets(0, 3, 31337, externalAddress);
      
      const participant = await zetaRaffle.getParticipantInfo(0, user1.address);
      expect(participant.ticketCount).to.equal(3);
      
      const raffle = await zetaRaffle.raffles(0);
      expect(raffle.totalTickets).to.equal(3);
      expect(raffle.prizePool).to.equal(TICKET_PRICE * 3n);
    });
  });
  
  describe("Winner Selection", function () {
    beforeEach(async function () {
      await zetaRaffle.createRaffle("Test Raffle", "Test Description", 0); // 0 days = end immediately
      
      const externalAddress1 = ethers.toUtf8Bytes("0x1111111111111111111111111111111111111111");
      const externalAddress2 = ethers.toUtf8Bytes("0x2222222222222222222222222222222222222222");
      
      await zetaRaffle.connect(user1).buyTickets(0, 1, 31337, externalAddress1);
      await zetaRaffle.connect(user2).buyTickets(0, 1, 31337, externalAddress2);
    });
    
    it("Should request randomness and select a winner", async function () {
      await expect(zetaRaffle.drawWinner(0))
        .to.emit(zetaRaffle, "RaffleStateChanged")
        .withArgs(0, 1) // DRAWING
        .to.emit(zetaRaffle, "EntropyRequested");
      
      const raffle = await zetaRaffle.raffles(0);
      expect(raffle.state).to.equal(1); // DRAWING
      
      // Mock entropy callback - simulating VRF response
      // Choose a random number that selects user1 as the winner (ticket 0)
      const randomNumber = 0;
      await mockPythEntropy.mockCallback(await zetaRaffle.getAddress(), randomNumber);
      
      const updatedRaffle = await zetaRaffle.raffles(0);
      expect(updatedRaffle.state).to.equal(2); // COMPLETE
      expect(updatedRaffle.winner).to.equal(user1.address);
    });
    
    it("Should allow winner to claim prize", async function () {
      await zetaRaffle.drawWinner(0);
      
      // Mock entropy callback
      const randomNumber = 0; // Select user1 as winner
      await mockPythEntropy.mockCallback(await zetaRaffle.getAddress(), randomNumber);
      
      // Check raffle state
      const raffle = await zetaRaffle.raffles(0);
      expect(raffle.winner).to.equal(user1.address);
      
      // Calculate expected prize amount (95% of prize pool)
      const prizePool = TICKET_PRICE * 2n;
      const operatorFee = (prizePool * 5n) / 100n;
      const expectedPrize = prizePool - operatorFee;
      
      // Initial balances
      const initialOwnerBalance = await mockZRC20.balanceOf(owner.address);
      const initialWinnerBalance = await mockZRC20.balanceOf(user1.address);
      
      // Claim prize
      await expect(zetaRaffle.connect(user1).claimPrize(0))
        .to.emit(zetaRaffle, "PrizeClaimed")
        .withArgs(0, user1.address, expectedPrize);
      
      // Check balances after claim
      const finalOwnerBalance = await mockZRC20.balanceOf(owner.address);
      const finalWinnerBalance = await mockZRC20.balanceOf(user1.address);
      
      expect(finalOwnerBalance - initialOwnerBalance).to.equal(operatorFee);
      expect(finalWinnerBalance - initialWinnerBalance).to.equal(expectedPrize);
    });
  });
});