// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script, console} from "forge-std/Script.sol";
import {GroupRegistry} from "../src/GroupRegistry.sol";
import {ConfidentialLedger} from "../src/ConfidentialLedger.sol";
import {Settlements} from "../src/Settlements.sol";

/// @notice Deploys the Veil contract suite. Run against a local Anvil node or Sepolia.
/// @dev  forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast --private-key $PK
contract Deploy is Script {
    function run() external returns (GroupRegistry registry, ConfidentialLedger ledger, Settlements settlements) {
        vm.startBroadcast();

        registry = new GroupRegistry();
        ledger = new ConfidentialLedger(registry);
        settlements = new Settlements(registry);

        vm.stopBroadcast();

        console.log("GroupRegistry:    ", address(registry));
        console.log("ConfidentialLedger:", address(ledger));
        console.log("Settlements:      ", address(settlements));
    }
}
