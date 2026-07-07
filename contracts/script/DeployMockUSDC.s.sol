// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script, console} from "forge-std/Script.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

contract DeployMockUSDC is Script {
    function run() external returns (MockUSDC token) {
        vm.startBroadcast();
        token = new MockUSDC();
        vm.stopBroadcast();
        console.log("MockUSDC:", address(token));
    }
}
