// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Testnet USDC stand-in for Veil cUSD repayments on Sepolia.
/// @dev Public mint for demos only. Do not deploy to mainnet.
contract MockUSDC is ERC20 {
    uint256 public constant MAX_MINT = 1_000 * 1e6;

    constructor() ERC20("Mock USDC", "mUSDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        require(to != address(0), "zero_address");
        require(amount > 0 && amount <= MAX_MINT, "amount_out_of_range");
        _mint(to, amount);
    }
}
