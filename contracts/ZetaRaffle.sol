// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/ZetaInterfaces.sol";

/**
 * @title ZetaRaffle
 * @dev A raffle system built on ZetaChain that uses ZETA as payment and reward method
 */
contract ZetaRaffle is Ownable, ReentrancyGuard {
    using EnumerableMap for EnumerableMap.UintToAddressMap;

    // Constants
    uint256 public constant TICKET_PRICE = 0.1 * 10**18; // 0.1 ZETA
    uint256 public constant MIN_PARTICIPANTS = 2; // Minimum participants to draw a winner
    uint256 public constant OPERATOR_FEE_PERCENTAGE = 5; // 5% fee for operator
    uint256 public constant ENTROPY_REQUEST_TIMEOUT = 24 hours; // Timeout for entropy request
    
    // Addresses
    address public pythEntropyAddress;
    address public zetaToken;
    
    // Structs
    enum RaffleState { ACTIVE, FINISHED, COMPLETED }
    
    struct RaffleInfo {
        uint256 raffleId;
        string name;
        string description;
        uint256 endTime;
        uint256 prizePool;
        RaffleState state;
        address winner;
        uint256 totalTickets;
        uint256 maxTickets; // Maximum number of tickets available
        uint64 entropyNonce;
        uint256 lastEntropyRequestTime;
    }
    
    struct Participant {
        address userAddress;
        uint256 ticketCount;
    }
    
    // Storage
    uint256 private _raffleIdCounter;
    mapping(uint256 => RaffleInfo) public raffles;
    mapping(uint256 => mapping(address => Participant)) public raffleParticipants;
    mapping(uint256 => EnumerableMap.UintToAddressMap) private _raffleTicketMap; // raffleId => (ticketNumber => participant address)
    mapping(uint256 => uint64) public randomnessRequests; // raffleId => entropy nonce
    
    // Events
    event RaffleCreated(uint256 indexed raffleId, string name, uint256 endTime, uint256 maxTickets);
    event TicketPurchased(
        uint256 indexed raffleId,
        address indexed participant,
        uint256 ticketCount,
        uint256 totalTickets
    );
    event RaffleStateChanged(uint256 indexed raffleId, RaffleState state);
    event EntropyRequested(uint256 indexed raffleId, uint64 nonce);
    event WinnerSelected(
        uint256 indexed raffleId,
        address indexed winner,
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
    
    modifier raffleIsActive(uint256 raffleId) {
        require(raffles[raffleId].state == RaffleState.ACTIVE, "Raffle not active");
        _;
    }
    
    modifier raffleCanBeDrawn(uint256 raffleId) {
        RaffleInfo storage raffle = raffles[raffleId];
        require(raffle.state == RaffleState.FINISHED, "Raffle not finished");
        
        // Allow drawing if end time has passed OR all tickets have been sold (for raffles with max tickets)
        bool timeExpired = block.timestamp >= raffle.endTime;
        bool soldOut = raffle.maxTickets > 0 && raffle.totalTickets == raffle.maxTickets;
        
        require(timeExpired || soldOut, "Raffle not ended yet");
        require(raffle.totalTickets >= MIN_PARTICIPANTS, "Not enough participants");
        _;
    }
    
    // Constructor
    constructor(
        address _pythEntropyAddress,
        address _zetaToken,
        address _initialOwner
    ) Ownable(_initialOwner) {
        pythEntropyAddress = _pythEntropyAddress;
        zetaToken = _zetaToken;
    }
    
    // External functions
    
    /**
     * @dev Create a new raffle
     * @param name Raffle name
     * @param description Raffle description
     * @param durationInDays Raffle duration in days
     * @param maxTickets Maximum number of tickets available (0 for unlimited)
     */
    function createRaffle(
        string memory name,
        string memory description,
        uint256 durationInDays,
        uint256 maxTickets
    ) external {
        require(durationInDays > 0, "Duration must be positive");
        
        uint256 raffleId = _raffleIdCounter++;
        uint256 endTime = block.timestamp + (durationInDays * 1 days);
        
        raffles[raffleId] = RaffleInfo({
            raffleId: raffleId,
            name: name,
            description: description,
            endTime: endTime,
            prizePool: 0,
            state: RaffleState.ACTIVE,
            winner: address(0),
            totalTickets: 0,
            maxTickets: maxTickets,
            entropyNonce: 0,
            lastEntropyRequestTime: 0
        });
        
        emit RaffleCreated(raffleId, name, endTime, maxTickets);
    }
    
    /**
     * @dev Update Pyth Entropy address
     * @param _pythEntropyAddress New Pyth Entropy address
     */
    function updatePythEntropyAddress(address _pythEntropyAddress) external onlyOwner {
        require(_pythEntropyAddress != address(0), "Invalid address");
        pythEntropyAddress = _pythEntropyAddress;
    }
    
    /**
     * @dev Buy tickets for a raffle with ZETA tokens
     * @param raffleId Raffle ID
     * @param ticketCount Number of tickets to buy
     */
    function buyTickets(
        uint256 raffleId,
        uint256 ticketCount
    ) external payable raffleExists(raffleId) raffleIsActive(raffleId) nonReentrant {
        require(ticketCount > 0, "Must buy at least one ticket");
        
        RaffleInfo storage raffle = raffles[raffleId];
        require(block.timestamp < raffle.endTime, "Raffle already ended");
        
        // Check if max tickets limit is reached
        if (raffle.maxTickets > 0) {
            require(raffle.totalTickets + ticketCount <= raffle.maxTickets, "Not enough tickets available");
            
            // If this purchase completes the ticket sale, change state to FINISHED
            if (raffle.totalTickets + ticketCount == raffle.maxTickets) {
                raffle.state = RaffleState.FINISHED;
                emit RaffleStateChanged(raffleId, RaffleState.FINISHED);
                
                // Defer the drawing to a separate transaction to avoid reversion
                // The owner can call autoDrawWinner, or anyone can call it if we make it permissionless
            }
        }
        
        uint256 totalPrice = TICKET_PRICE * ticketCount;
        
        // Ensure correct amount is sent
        require(msg.value == totalPrice, "Incorrect ZETA amount sent");
        
        // Update participant info
        _updateParticipant(raffleId, msg.sender, ticketCount);
        
        // Update prize pool
        raffle.prizePool += totalPrice;
        
        emit TicketPurchased(
            raffleId, 
            msg.sender,
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
        _initiateDrawing(raffleId);
    }
    
    /**
     * @dev Allow anyone to draw a winner for a raffle if it's in FINISHED state
     * @param raffleId Raffle ID
     */
    function autoDrawWinner(uint256 raffleId) 
        external 
        raffleExists(raffleId) 
        raffleCanBeDrawn(raffleId)
        onlyOwner
    {
        _initiateDrawing(raffleId);
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
     * @dev Claim prize automatically sends rewards to the winner
     * @param raffleId Raffle ID
     */
    function claimPrize(uint256 raffleId) 
        external 
        raffleExists(raffleId)
        onlyOwner
        nonReentrant
    {
        RaffleInfo storage raffle = raffles[raffleId];
        require(raffle.state == RaffleState.COMPLETED, "Raffle not completed");
        require(raffle.winner != address(0), "No winner selected");
        require(raffle.prizePool > 0, "Prize already claimed");
        
        // Calculate prize amount (minus operator fee)
        uint256 operatorFee = (raffle.prizePool * OPERATOR_FEE_PERCENTAGE) / 100;
        uint256 prizeAmount = raffle.prizePool - operatorFee;
        
        // Reset prize pool
        raffle.prizePool = 0;
        
        // Send operator fee to owner
        (bool feeSuccess, ) = payable(owner()).call{value: operatorFee}("");
        require(feeSuccess, "Fee transfer failed");
        
        // Send prize to winner
        (bool prizeSuccess, ) = payable(raffle.winner).call{value: prizeAmount}("");
        require(prizeSuccess, "Prize transfer failed");
        
        emit PrizeClaimed(raffleId, raffle.winner, prizeAmount);
    }
    
    // Internal functions
    
    /**
     * @dev Update participant information
     */
    function _updateParticipant(
        uint256 raffleId,
        address participant,
        uint256 ticketCount
    ) internal {
        RaffleInfo storage raffle = raffles[raffleId];
        Participant storage p = raffleParticipants[raffleId][participant];
        
        if (p.ticketCount == 0) {
            // New participant
            p.userAddress = participant;
            p.ticketCount = ticketCount;
        } else {
            // Existing participant
            p.ticketCount += ticketCount;
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
        require(raffle.state == RaffleState.FINISHED, "Raffle not in finished state");
        require(raffle.totalTickets >= MIN_PARTICIPANTS, "Not enough participants");
        
        // Use randomNumber to select a ticket
        uint256 winningTicket = randomNumber % raffle.totalTickets;
        address winnerAddress = _raffleTicketMap[raffleId].get(winningTicket);
        
        // Update raffle with winner info
        raffle.winner = winnerAddress;
        raffle.state = RaffleState.COMPLETED;
        
        emit RaffleStateChanged(raffleId, RaffleState.COMPLETED);
        emit WinnerSelected(
            raffleId, 
            winnerAddress,
            raffle.prizePool
        );
    }
    
    /**
     * @dev Internal function to initiate the drawing process
     * @param raffleId Raffle ID
     */
    function _initiateDrawing(uint256 raffleId) internal {
        RaffleInfo storage raffle = raffles[raffleId];
        
        // Ensure we're not already requesting entropy or if it's been too long since last request
        if (raffle.lastEntropyRequestTime > 0) {
            require(
                block.timestamp > raffle.lastEntropyRequestTime + ENTROPY_REQUEST_TIMEOUT,
                "Previous entropy request still pending"
            );
        }
        
        // Request randomness from Pyth Entropy
        uint64 nonce = uint64(uint256(keccak256(abi.encodePacked(block.timestamp, raffleId, _raffleIdCounter))));
        randomnessRequests[raffleId] = nonce;
        raffle.entropyNonce = nonce;
        raffle.lastEntropyRequestTime = block.timestamp;
        
        IPythEntropy entropy = IPythEntropy(pythEntropyAddress);
        entropy.generateRandomNumber(nonce);
        
        emit EntropyRequested(raffleId, nonce);
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
    
    /**
     * @dev Receive function to accept ZETA
     */
    receive() external payable {}
}