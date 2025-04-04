// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ZetaChain interfaces for cross-chain messaging
interface ZetaInterfaces {
    struct CrossChainMessage {
        bytes originSenderAddress;
        uint256 originChainId;
        address destinationAddress;
        uint256 zetaValueAndGas;
        uint256 destinationGasLimit;
        bytes message;
        bytes zetaParams;
    }
}

interface ZetaConnector {
    function send(ZetaInterfaces.CrossChainMessage calldata message) external returns (bytes32);
}

interface ZetaReceiver {
    function onZetaMessage(
        bytes32 messageHash,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external;

    function onZetaRevert(
        bytes32 messageHash,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external;
}

interface IZRC20 {
    function deposit(address to, uint256 amount) external payable;
    function withdraw(bytes calldata to, uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
}

// Entropy Service (VRF) Interface
interface IPythEntropy {
    function generateRandomNumber(uint64 nonce) external;
    function receivesRandomNumber(address user, uint256 randomNumber) external;
}