// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/ZetaInterfaces.sol";

/**
 * @title ZetaRaffle
 * @dev A cross-chain raffle system built on ZetaChain that supports entries from multiple chains
 */
contract ZetaRaffle is Ownable, ReentrancyGuard, ZetaReceiver {
    using EnumerableMap for EnumerableMap.UintToAddressMap;
    using EnumerableMap for EnumerableMap.AddressToUintMap;

    // Constants
    uint256 public constant TICKET_PRICE = 0.001 * 10**18; // 0.001 tokens (adjusted for decimals)
    uint256 public constant MIN_PARTICIPANTS = 2; // Minimum participants to draw a winner
    uint256 public constant OPERATOR_FEE_PERCENTAGE = 5; // 5% fee for operator
    uint256 public constant ENTROPY_REQUEST_TIMEOUT = 24 hours; // Timeout for entropy request
    
    // Addresses
    address public pythEntropyAddress;
    address public zetaConnectorAddress;
    mapping(uint256 => address) public chainToZRC20; // Chain ID to ZRC20 token address
    
    // Structs
    enum RaffleState { OPEN, DRAWING, COMPLETE }
    
    struct RaffleInfo {
        uint256 raffleId;
        string name;
        string description;
        uint256 endTime;
        uint256 prizePool;
        RaffleState state;
        address winner;
        uint256 winnerChainId;
        bytes winnerExternalAddress;
        uint256 totalTickets;
        uint64 entropyNonce;
        uint256 lastEntropyRequestTime;
        uint256 maxParticipants; // Maximum number of participants (0 = unlimited)
    }
    
    struct Participant {
        address zetaAddress;
        uint256 chainId;
        bytes externalAddress;
        uint256 ticketCount;
    }
    
    // Storage
    uint256 private _raffleIdCounter;
    mapping(uint256 => RaffleInfo) public raffles;
    mapping(uint256 => mapping(address => Participant)) public raffleParticipants;
    mapping(uint256 => EnumerableMap.UintToAddressMap) private _raffleTicketMap; // raffleId => (ticketNumber => participant address)
    mapping(uint256 => uint64) public randomnessRequests; // raffleId => entropy nonce
    
    // Events
    event RaffleCreated(uint256 indexed raffleId, string name, uint256 endTime, uint256 maxParticipants);
    event TicketPurchased(
        uint256 indexed raffleId,
        address indexed participant,
        uint256 chainId,
        bytes externalAddress,
        uint256 ticketCount,
        uint256 totalTickets
    );
    event RaffleStateChanged(uint256 indexed raffleId, RaffleState state);
    event EntropyRequested(uint256 indexed raffleId, uint64 nonce);
    event WinnerSelected(
        uint256 indexed raffleId,
        address indexed winner,
        uint256 winnerChainId,
        bytes winnerExternalAddress,
        uint256 prizeAmount
    );
    event PrizeClaimed(uint256 indexed raffleId, address indexed winner, uint256 amount);
    
    // Modifiers
    modifier onlyParticipant(uint256 raffleId) {
        require(
            raffleParticipants[raffleId][msg.sender].ticketCount > 0,
            "Not a participant"
        );
        _;
    }
    
    modifier raffleExists(uint256 raffleId) {
        require(raffleId < _raffleIdCounter, "Raffle does not exist");
        _;
    }
    
    modifier raffleIsOpen(uint256 raffleId) {
        require(raffles[raffleId].state == RaffleState.OPEN, "Raffle not open");
        _;
    }
    
    modifier raffleCanBeDrawn(uint256 raffleId) {
        require(raffles[raffleId].state == RaffleState.OPEN, "Raffle not open");
        require(block.timestamp >= raffles[raffleId].endTime, "Raffle not ended");
        require(raffles[raffleId].totalTickets >= MIN_PARTICIPANTS, "Not enough participants");
        _;
    }
    
    // Constructor
    constructor(
        address _pythEntropyAddress,
        address _zetaConnectorAddress,
        address _initialOwner
    ) Ownable(_initialOwner) {
        pythEntropyAddress = _pythEntropyAddress;
        zetaConnectorAddress = _zetaConnectorAddress;
    }
    
    // External functions
    
    /**
     * @dev Create a new raffle
     * @param name Raffle name
     * @param description Raffle description
     * @param durationInDays Raffle duration in days
     * @param maxParticipants Maximum number of participants (0 for unlimited)
     */
    function createRaffle(
        string memory name,
        string memory description,
        uint256 durationInDays,
        uint256 maxParticipants
    ) external onlyOwner {
        require(durationInDays > 0, "Duration must be positive");
        
        uint256 raffleId = _raffleIdCounter++;
        uint256 endTime = block.timestamp + (durationInDays * 1 days);
        
        raffles[raffleId] = RaffleInfo({
            raffleId: raffleId,
            name: name,
            description: description,
            endTime: endTime,
            prizePool: 0,
            state: RaffleState.OPEN,
            winner: address(0),
            winnerChainId: 0,
            winnerExternalAddress: "",
            totalTickets: 0,
            entropyNonce: 0,
            lastEntropyRequestTime: 0,
            maxParticipants: maxParticipants
        });
        
        emit RaffleCreated(raffleId, name, endTime, maxParticipants);
    }
    
    /**
     * @dev Register ZRC20 token for a chain
     * @param chainId Chain ID
     * @param zrc20Address ZRC20 token address
     */
    function registerZRC20(uint256 chainId, address zrc20Address) external onlyOwner {
        require(zrc20Address != address(0), "Invalid ZRC20 address");
        chainToZRC20[chainId] = zrc20Address;
    }
    
    /**
     * @dev Buy tickets for a raffle with ZRC20 tokens (for participants already on ZetaChain)
     * @param raffleId Raffle ID
     * @param ticketCount Number of tickets to buy
     * @param preferredChainId Chain ID where user wants to receive prizes
     * @param externalAddress External address on the preferred chain (in bytes format)
     */
    function buyTickets(
        uint256 raffleId,
        uint256 ticketCount,
        uint256 preferredChainId,
        bytes calldata externalAddress
    ) external raffleExists(raffleId) raffleIsOpen(raffleId) nonReentrant {
        require(ticketCount > 0, "Must buy at least one ticket");
        require(externalAddress.length > 0, "External address required");
        
        RaffleInfo storage raffle = raffles[raffleId];
        require(block.timestamp < raffle.endTime, "Raffle already ended");
        
        // Check max participants limit if set
        if (raffle.maxParticipants > 0) {
            // Only count new participants toward the limit
            if (raffleParticipants[raffleId][msg.sender].ticketCount == 0) {
                // Calculate current unique participant count
                uint256 participantCount = 0;
                for (uint256 i = 0; i < raffle.totalTickets; i++) {
                    (bool exists, address participant) = _raffleTicketMap[raffleId].tryGet(i);
                    if (exists && raffleParticipants[raffleId][participant].ticketCount > 0) {
                        participantCount++;
                        i += raffleParticipants[raffleId][participant].ticketCount - 1; // Skip to next participant
                    }
                }
                require(participantCount < raffle.maxParticipants, "Maximum participants reached");
            }
        }
        
        // Determine which ZRC20 token to use based on preferred chain
        address zrc20Address = chainToZRC20[preferredChainId];
        require(zrc20Address != address(0), "Unsupported chain");
        
        uint256 totalPrice = TICKET_PRICE * ticketCount;
        
        // Transfer tokens from user to contract
        IZRC20 zrc20 = IZRC20(zrc20Address);
        require(zrc20.transferFrom(msg.sender, address(this), totalPrice), "Token transfer failed");
        
        // Update participant info
        _updateParticipant(raffleId, msg.sender, preferredChainId, externalAddress, ticketCount);
        
        // Update prize pool
        raffle.prizePool += totalPrice;
        
        emit TicketPurchased(
            raffleId, 
            msg.sender, 
            preferredChainId, 
            externalAddress, 
            ticketCount, 
            raffle.totalTickets
        );
    }
    
    /**
     * @dev Draw a winner for a raffle using Pyth Entropy (VRF)
     * @param raffleId Raffle ID
     */
    function drawWinner(uint256 raffleId) 
        external 
        raffleExists(raffleId) 
        raffleCanBeDrawn(raffleId) 
        onlyOwner
    {
        RaffleInfo storage raffle = raffles[raffleId];
        
        // Ensure we're not already in drawing state or if it's been too long since last request
        if (raffle.state == RaffleState.DRAWING) {
            require(
                block.timestamp > raffle.lastEntropyRequestTime + ENTROPY_REQUEST_TIMEOUT,
                "Previous entropy request still pending"
            );
        }
        
        // Update state to drawing
        raffle.state = RaffleState.DRAWING;
        emit RaffleStateChanged(raffleId, RaffleState.DRAWING);
        
        // Request randomness from Pyth Entropy
        uint64 nonce = uint64(uint256(keccak256(abi.encodePacked(block.timestamp, raffleId, _raffleIdCounter))));
        randomnessRequests[raffleId] = nonce;
        raffle.entropyNonce = nonce;
        raffle.lastEntropyRequestTime = block.timestamp;
        
        IPythEntropy entropy = IPythEntropy(pythEntropyAddress);
        entropy.generateRandomNumber(nonce);
        
        emit EntropyRequested(raffleId, nonce);
    }
    
    /**
     * @dev Callback from Pyth Entropy to receive random number
     * @param user Address that requested the random number
     * @param randomNumber The random number generated
     */
    function receivesRandomNumber(address user, uint256 randomNumber) external {
        require(msg.sender == pythEntropyAddress, "Only Pyth Entropy can call");
        require(user == address(this), "Unauthorized randomness request");
        
        // Find which raffle this is for
        uint256 raffleId;
        uint64 nonce = uint64(randomNumber);
        bool foundRaffle = false;
        
        for (uint256 i = 0; i < _raffleIdCounter; i++) {
            if (randomnessRequests[i] == nonce) {
                raffleId = i;
                foundRaffle = true;
                break;
            }
        }
        
        require(foundRaffle, "No raffle found for this nonce");
        
        // Select winner
        _selectWinner(raffleId, randomNumber);
    }
    
    /**
     * @dev Claim prize as a winner
     * @param raffleId Raffle ID
     */
    function claimPrize(uint256 raffleId) 
        external 
        raffleExists(raffleId) 
        onlyParticipant(raffleId) 
        nonReentrant
    {
        RaffleInfo storage raffle = raffles[raffleId];
        require(raffle.state == RaffleState.COMPLETE, "Raffle not complete");
        require(raffle.winner == msg.sender, "Not the winner");
        
        // Calculate prize amount (minus operator fee)
        uint256 operatorFee = (raffle.prizePool * OPERATOR_FEE_PERCENTAGE) / 100;
        uint256 prizeAmount = raffle.prizePool - operatorFee;
        
        // Reset prize pool
        raffle.prizePool = 0;
        
        // Send operator fee to owner
        address zrc20Address = chainToZRC20[raffle.winnerChainId];
        IZRC20 zrc20 = IZRC20(zrc20Address);
        require(zrc20.transfer(owner(), operatorFee), "Fee transfer failed");
        
        // If winner is on ZetaChain, transfer tokens directly
        if (raffle.winnerExternalAddress.length == 0) {
            require(zrc20.transfer(raffle.winner, prizeAmount), "Prize transfer failed");
        } else {
            // Otherwise, withdraw to external chain
            zrc20.withdraw(raffle.winnerExternalAddress, prizeAmount);
        }
        
        emit PrizeClaimed(raffleId, msg.sender, prizeAmount);
    }
    
    /**
     * @dev ZetaChain message receiver
     */
    function onZetaMessage(
        // Boris: are the next two parameters correct?
        bytes32 messageHash,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external override {
        require(msg.sender == zetaConnectorAddress, "Only ZetaConnector can call");
        
        // Decode message (raffleId, participant address, chain ID, external address)
        (uint256 raffleId, address participant, uint256 chainId, bytes memory externalAddress) = 
            abi.decode(message, (uint256, address, uint256, bytes));
            
        require(raffleId < _raffleIdCounter, "Invalid raffle ID");
        RaffleInfo storage raffle = raffles[raffleId];
        require(raffle.state == RaffleState.OPEN, "Raffle not open");
        
        // Calculate ticket count
        uint256 ticketCount = amount / TICKET_PRICE;
        require(ticketCount > 0, "Amount too small");
        
        // Update participant info
        _updateParticipant(raffleId, participant, chainId, externalAddress, ticketCount);
        
        // Update prize pool
        raffle.prizePool += amount;
        
        emit TicketPurchased(
            raffleId, 
            participant, 
            chainId, 
            externalAddress, 
            ticketCount, 
            raffle.totalTickets
        );
    }
    
    /**
     * @dev ZetaChain revert message handler
     */
    function onZetaRevert(
        // Boris: are `messageHash` and `calldata message` correct?
        bytes32 messageHash,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external override {
        require(msg.sender == zetaConnectorAddress, "Only ZetaConnector can call");
        // Handle revert by returning tokens to contract owner
        IZRC20(zrc20).transfer(owner(), amount);
    }
    
    // Internal functions
    
    /**
     * @dev Update participant information
     */
    function _updateParticipant(
        uint256 raffleId,
        address participant,
        uint256 chainId,
        bytes memory externalAddress,
        uint256 ticketCount
    ) internal {
        RaffleInfo storage raffle = raffles[raffleId];
        Participant storage p = raffleParticipants[raffleId][participant];
        
        if (p.ticketCount == 0) {
            // New participant
            p.zetaAddress = participant;
            p.chainId = chainId;
            p.externalAddress = externalAddress;
            p.ticketCount = ticketCount;
        } else {
            // Existing participant
            p.ticketCount += ticketCount;
            // Update chain preference if provided
            if (externalAddress.length > 0) {
                p.chainId = chainId;
                p.externalAddress = externalAddress;
            }
        }
        
        // Assign tickets
        uint256 startTicket = raffle.totalTickets;
        for (uint256 i = 0; i < ticketCount; i++) {
            _raffleTicketMap[raffleId].set(startTicket + i, participant);
        }
        
        // Update total tickets
        raffle.totalTickets += ticketCount;
    }
    
    /**
     * @dev Select winner using the provided random number
     */
    function _selectWinner(uint256 raffleId, uint256 randomNumber) internal {
        RaffleInfo storage raffle = raffles[raffleId];
        require(raffle.state == RaffleState.DRAWING, "Raffle not in drawing state");
        require(raffle.totalTickets >= MIN_PARTICIPANTS, "Not enough participants");
        
        // Use randomNumber to select a ticket
        uint256 winningTicket = randomNumber % raffle.totalTickets;
        address winnerAddress = _raffleTicketMap[raffleId].get(winningTicket);
        
        // Update raffle with winner info
        Participant storage winner = raffleParticipants[raffleId][winnerAddress];
        raffle.winner = winnerAddress;
        raffle.winnerChainId = winner.chainId;
        raffle.winnerExternalAddress = winner.externalAddress;
        raffle.state = RaffleState.COMPLETE;
        
        emit RaffleStateChanged(raffleId, RaffleState.COMPLETE);
        emit WinnerSelected(
            raffleId, 
            winnerAddress, 
            winner.chainId, 
            winner.externalAddress, 
            raffle.prizePool
        );
    }
    
    // View functions
    
    /**
     * @dev Get all raffles
     */
    function getAllRaffles() external view returns (RaffleInfo[] memory) {
        RaffleInfo[] memory allRaffles = new RaffleInfo[](_raffleIdCounter);
        for (uint256 i = 0; i < _raffleIdCounter; i++) {
            allRaffles[i] = raffles[i];
        }
        return allRaffles;
    }
    
    /**
     * @dev Get participant info
     */
    function getParticipantInfo(uint256 raffleId, address participant) 
        external 
        view 
        returns (Participant memory) 
    {
        return raffleParticipants[raffleId][participant];
    }
    
    /**
     * @dev Get total ticket count for a participant
     */
    function getTicketCount(uint256 raffleId, address participant) 
        external 
        view 
        returns (uint256) 
    {
        return raffleParticipants[raffleId][participant].ticketCount;
    }
}