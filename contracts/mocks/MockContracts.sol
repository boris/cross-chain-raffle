// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../interfaces/ZetaInterfaces.sol";

/**
 * @title MockZRC20
 * @dev A mock ZRC20 token for testing
 */
contract MockZRC20 is ERC20 {
    uint8 private _decimals;

    constructor(string memory name, string memory symbol, uint8 decimals_) ERC20(name, symbol) {
        _decimals = decimals_;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function deposit(address to, uint256 amount) external payable {
        _mint(to, amount);
    }

    function withdraw(bytes calldata to, uint256 amount) external {
        _burn(msg.sender, amount);
    }
}

/**
 * @title MockPythEntropy
 * @dev A mock Pyth Entropy service for testing
 */
contract MockPythEntropy is IPythEntropy {
    function generateRandomNumber(uint64 nonce) external override {
        // Just store the nonce, don't generate anything yet
    }

    function mockCallback(address user, uint256 randomNumber) external {
        // Send the callback to the user contract
        IPythEntropy(user).receivesRandomNumber(user, randomNumber);
    }

    function receivesRandomNumber(address user, uint256 randomNumber) external override {
        // This is only implemented to match the interface
        revert("Not implemented");
    }
}

/**
 * @title MockZetaConnector
 * @dev A mock ZetaConnector for testing
 */
contract MockZetaConnector is ZetaConnector {
    function send(ZetaInterfaces.CrossChainMessage calldata message) external override returns (bytes32) {
        // Just return a dummy hash
        return bytes32(keccak256(abi.encodePacked(message.message)));
    }
}