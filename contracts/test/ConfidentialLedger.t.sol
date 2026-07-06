// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FhevmTest} from "forge-fhevm/FhevmTest.sol";
import {euint64, externalEuint64} from "encrypted-types/EncryptedTypes.sol";
import {GroupRegistry} from "../src/GroupRegistry.sol";
import {ConfidentialLedger} from "../src/ConfidentialLedger.sol";

contract ConfidentialLedgerTest is FhevmTest {
    GroupRegistry internal registry;
    ConfidentialLedger internal ledger;
    address internal ledgerAddress;

    Account internal alice;
    Account internal bob;

    uint256 internal groupId;

    function setUp() public override {
        super.setUp();
        registry = new GroupRegistry();
        ledger = new ConfidentialLedger(registry);
        ledgerAddress = address(ledger);

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

    /// Alice pays 100 that is fully owed by bob (a single-share expense).
    /// After: alice.paid = 100, bob.owed = 100.
    function test_recordExpense_updatesEncryptedAccumulators() public {
        // One ciphertext (100) reused as both total and bob's share — one proof covers it.
        (externalEuint64 enc, bytes memory proof) = encryptUint64(100, alice.addr, ledgerAddress);

        address[] memory participants = new address[](1);
        participants[0] = bob.addr;
        externalEuint64[] memory shares = new externalEuint64[](1);
        shares[0] = enc;

        vm.prank(alice.addr);
        ledger.recordExpense(groupId, participants, enc, shares, proof);

        uint256 alicePaid = userDecryptAs(alice.key, euint64.unwrap(ledger.paidOf(groupId, alice.addr)), ledgerAddress);
        uint256 bobOwed = userDecryptAs(bob.key, euint64.unwrap(ledger.owedOf(groupId, bob.addr)), ledgerAddress);

        assertEq(alicePaid, 100);
        assertEq(bobOwed, 100);
    }

    /// Accumulators add across multiple expenses.
    function test_recordExpense_accumulates() public {
        (externalEuint64 enc1, bytes memory proof1) = encryptUint64(40, alice.addr, ledgerAddress);
        (externalEuint64 enc2, bytes memory proof2) = encryptUint64(60, alice.addr, ledgerAddress);

        address[] memory participants = new address[](1);
        participants[0] = bob.addr;

        vm.startPrank(alice.addr);
        ledger.recordExpense(groupId, participants, enc1, _wrap(enc1), proof1);
        ledger.recordExpense(groupId, participants, enc2, _wrap(enc2), proof2);
        vm.stopPrank();

        uint256 alicePaid = userDecryptAs(alice.key, euint64.unwrap(ledger.paidOf(groupId, alice.addr)), ledgerAddress);
        uint256 bobOwed = userDecryptAs(bob.key, euint64.unwrap(ledger.owedOf(groupId, bob.addr)), ledgerAddress);

        assertEq(alicePaid, 100);
        assertEq(bobOwed, 100);
    }

    /// Participants can decrypt the expense total (not only their share).
    function test_recordExpense_participantCanDecryptTotal() public {
        (externalEuint64 enc, bytes memory proof) = encryptUint64(100, alice.addr, ledgerAddress);

        address[] memory participants = new address[](1);
        participants[0] = bob.addr;
        externalEuint64[] memory shares = new externalEuint64[](1);
        shares[0] = enc;

        vm.prank(alice.addr);
        uint256 expenseId = ledger.recordExpense(groupId, participants, enc, shares, proof);

        uint256 bobTotal =
            userDecryptAs(bob.key, euint64.unwrap(ledger.expenseTotal(expenseId)), ledgerAddress);
        assertEq(bobTotal, 100);
    }

    /// A non-member cannot record an expense.
    function test_recordExpense_revertsForNonMember() public {
        Account memory mallory = makeAccount("mallory");
        (externalEuint64 enc, bytes memory proof) = encryptUint64(10, mallory.addr, ledgerAddress);

        address[] memory participants = new address[](1);
        participants[0] = mallory.addr;

        vm.prank(mallory.addr);
        vm.expectRevert(abi.encodeWithSelector(ConfidentialLedger.NotGroupMember.selector, mallory.addr));
        ledger.recordExpense(groupId, participants, enc, _wrap(enc), proof);
    }

    function _wrap(externalEuint64 s) internal pure returns (externalEuint64[] memory arr) {
        arr = new externalEuint64[](1);
        arr[0] = s;
    }
}
