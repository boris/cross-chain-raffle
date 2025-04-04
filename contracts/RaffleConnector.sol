// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/ZetaInterfaces.sol";

/**
 * @title RaffleConnector
 * @dev A connector contract deployed on external chains to allow users to enter raffles from their native chain
 */
contract RaffleConnector is Ownable {
    // ZetaChain addresses
    address public zetaConnectorAddress;
    address public zetaTokenAddress;
    address public targetZetaRaffleAddress;
    uint256 public zetaChainId;
    
    // Local chain details
    uint256 public nativeChainId;
    mapping(address => bool) public supportedTokens;
    
    // Events
    event RaffleEntry(
        address indexed participant,
        uint256 raffleId,
        address tokenAddress,
        uint256 amount,
        uint256 preferredChainId,
        bytes externalAddress
    );
    
    // Constructor
    constructor(
        address _zetaConnectorAddress,
        address _zetaTokenAddress,
        address _targetZetaRaffleAddress,
        uint256 _zetaChainId,
        uint256 _nativeChainId,
        address _initialOwner
    ) Ownable(_initialOwner) {
        zetaConnectorAddress = _zetaConnectorAddress;
        zetaTokenAddress = _zetaTokenAddress;
        targetZetaRaffleAddress = _targetZetaRaffleAddress;
        zetaChainId = _zetaChainId;
        nativeChainId = _nativeChainId;
    }
    
    /**
     * @dev Add a supported token
     * @param tokenAddress Token address to support
     */
    function addSupportedToken(address tokenAddress) external onlyOwner {
        supportedTokens[tokenAddress] = true;
    }
    
    /**
     * @dev Remove a supported token
     * @param tokenAddress Token address to remove
     */
    function removeSupportedToken(address tokenAddress) external onlyOwner {
        supportedTokens[tokenAddress] = false;
    }
    
    /**
     * @dev Enter a raffle from the external chain
     * @param raffleId Raffle ID
     * @param tokenAddress Token address to use
     * @param amount Amount of tokens to spend
     * @param preferredChainId Chain ID where user wants to receive prizes
     * @param externalAddress External address on the preferred chain
     */
    function enterRaffle(
        uint256 raffleId,
        address tokenAddress,
        uint256 amount,
        uint256 preferredChainId,
        bytes calldata externalAddress
    ) external {
        require(supportedTokens[tokenAddress], "Unsupported token");
        require(amount > 0, "Amount must be positive");
        require(externalAddress.length > 0, "External address required");
        
        // Transfer tokens from user to this contract
        IERC20 token = IERC20(tokenAddress);
        require(token.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        
        // Approve ZetaConnector to spend tokens
        token.approve(zetaConnectorAddress, amount);
        
        // Prepare cross-chain message
        bytes memory message = abi.encode(
            raffleId,
            msg.sender,
            preferredChainId,
            externalAddress
        );
        
        ZetaInterfaces.CrossChainMessage memory crossChainMessage = ZetaInterfaces.CrossChainMessage({
            originSenderAddress: abi.encodePacked(msg.sender),
            originChainId: nativeChainId,
            destinationAddress: targetZetaRaffleAddress,
            zetaValueAndGas: amount,
            destinationGasLimit: 300000,
            message: message,
            zetaParams: ""
        });
        
        // Send cross-chain message
        ZetaConnector connector = ZetaConnector(zetaConnectorAddress);
        connector.send(crossChainMessage);
        
        emit RaffleEntry(
            msg.sender,
            raffleId,
            tokenAddress,
            amount,
            preferredChainId,
            externalAddress
        );
    }
    
    /**
     * @dev Withdraw any stuck tokens (emergency function)
     * @param tokenAddress Token address
     * @param to Address to send tokens to
     * @param amount Amount to withdraw
     */
    function withdrawStuckTokens(
        address tokenAddress,
        address to,
        uint256 amount
    ) external onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        require(token.transfer(to, amount), "Token transfer failed");
    }
}