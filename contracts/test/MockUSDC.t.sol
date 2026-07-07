// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Test} from "forge-std/Test.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

contract MockUSDCTest is Test {
    MockUSDC internal token;

    function setUp() public {
        token = new MockUSDC();
    }

    function testMint() public {
        token.mint(address(this), 100e6);
        assertEq(token.balanceOf(address(this)), 100e6);
    }

    function testRevertsAboveMaxMint() public {
        vm.expectRevert("amount_out_of_range");
        token.mint(address(this), token.MAX_MINT() + 1);
    }
}
