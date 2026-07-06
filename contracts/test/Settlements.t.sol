// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FhevmTest} from "forge-fhevm/FhevmTest.sol";
import {euint64, externalEuint64} from "encrypted-types/EncryptedTypes.sol";
import {GroupRegistry} from "../src/GroupRegistry.sol";
import {Settlements} from "../src/Settlements.sol";

contract SettlementsTest is FhevmTest {
    GroupRegistry internal registry;
    Settlements internal settlements;
    address internal settlementsAddress;

    Account internal alice; // payer
    Account internal bob; // payee
    uint256 internal groupId;

    function setUp() public override {
        super.setUp();
        registry = new GroupRegistry();
        settlements = new Settlements(registry);
        settlementsAddress = address(settlements);

        alice = makeAccount("alice");
        bob = makeAccount("bob");

        address[] memory initial = new address[](1);
        initial[0] = bob.addr;
        vm.prank(alice.addr);
        groupId = registry.createGroup(initial);
    }

    function userDecryptAs(uint256 userPk, bytes32 handle, address contractAddress) internal returns (uint256) {
        bytes memory sig = signUserDecrypt(userPk, contractAddress);
        return userDecrypt(handle, vm.addr(userPk), contractAddress, sig);
    }

    /// Both payer and payee can decrypt the settlement amount.
    function test_createSettlement_payerAndPayeeCanDecrypt() public {
        (externalEuint64 enc, bytes memory proof) = encryptUint64(4500, alice.addr, settlementsAddress);

        vm.prank(alice.addr);
        uint256 id = settlements.createSettlement(groupId, bob.addr, enc, proof);

        uint256 asPayer = userDecryptAs(alice.key, euint64.unwrap(settlements.amountOf(id)), settlementsAddress);
        uint256 asPayee = userDecryptAs(bob.key, euint64.unwrap(settlements.amountOf(id)), settlementsAddress);

        assertEq(asPayer, 4500);
        assertEq(asPayee, 4500);
    }

    /// Payer can mark paid; others cannot.
    function test_markPaid_onlyPayer() public {
        (externalEuint64 enc, bytes memory proof) = encryptUint64(1000, alice.addr, settlementsAddress);
        vm.prank(alice.addr);
        uint256 id = settlements.createSettlement(groupId, bob.addr, enc, proof);

        vm.prank(bob.addr);
        vm.expectRevert(Settlements.OnlyPayer.selector);
        settlements.markPaid(id);

        vm.prank(alice.addr);
        settlements.markPaid(id);

        (,,, bool paid,) = settlements.settlementInfo(id);
        assertTrue(paid);
    }

    /// Non-members cannot be part of a settlement.
    function test_createSettlement_revertsForNonMember() public {
        Account memory mallory = makeAccount("mallory");
        (externalEuint64 enc, bytes memory proof) = encryptUint64(1, alice.addr, settlementsAddress);

        vm.prank(alice.addr);
        vm.expectRevert(abi.encodeWithSelector(Settlements.NotGroupMember.selector, mallory.addr));
        settlements.createSettlement(groupId, mallory.addr, enc, proof);
    }
}
