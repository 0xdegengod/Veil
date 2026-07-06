// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {GroupRegistry} from "./GroupRegistry.sol";

/// @title ConfidentialLedger
/// @notice Tracks encrypted group balances and per-expense share breakdowns.
/// @dev Aggregate `paid`/`owed` give each member their net position. Per-expense shares
///      are retained so the payer sees the full split, each participant sees the
///      expense total and their own share, and observers see neither. Share settlement
///      status is plaintext
///      (paid/pending) — amounts stay encrypted.
contract ConfidentialLedger is ZamaEthereumConfig {
    GroupRegistry public immutable registry;

    struct ExpenseMeta {
        uint256 groupId;
        address payer;
        euint64 total;
        bool exists;
    }

    mapping(uint256 groupId => mapping(address member => euint64)) private _paid;
    mapping(uint256 groupId => mapping(address member => euint64)) private _owed;

    mapping(uint256 expenseId => ExpenseMeta) private _expenses;
    mapping(uint256 expenseId => address[]) private _expenseParticipants;
    mapping(uint256 expenseId => mapping(address => euint64)) private _expenseShare;
    mapping(uint256 expenseId => mapping(address => bool)) private _shareSettled;

    uint256 public nextExpenseId = 1;

    event ExpenseRecorded(uint256 indexed groupId, uint256 indexed expenseId, address indexed payer);
    event ExpenseShareSettled(uint256 indexed expenseId, address indexed participant);

    error NotGroupMember(address who);
    error SharesLengthMismatch();
    error ExpenseMissing();
    error OnlyPayer();
    error AlreadySettled();

    constructor(GroupRegistry _registry) {
        registry = _registry;
    }

    /// @notice Record an expense paid by `msg.sender`, split across `participants`.
    function recordExpense(
        uint256 groupId,
        address[] calldata participants,
        externalEuint64 encTotal,
        externalEuint64[] calldata encShares,
        bytes calldata inputProof
    ) external returns (uint256 expenseId) {
        if (!registry.isMember(groupId, msg.sender)) revert NotGroupMember(msg.sender);
        if (participants.length != encShares.length) revert SharesLengthMismatch();

        expenseId = nextExpenseId++;

        euint64 total = FHE.fromExternal(encTotal, inputProof);
        FHE.allowThis(total);
        FHE.allow(total, msg.sender);

        _expenses[expenseId] = ExpenseMeta({
            groupId: groupId,
            payer: msg.sender,
            total: total,
            exists: true
        });

        _addPaid(groupId, msg.sender, total);

        for (uint256 i; i < participants.length; ++i) {
            address participant = participants[i];
            if (!registry.isMember(groupId, participant)) revert NotGroupMember(participant);

            euint64 share = FHE.fromExternal(encShares[i], inputProof);
            _expenseParticipants[expenseId].push(participant);
            _expenseShare[expenseId][participant] = share;

            // Payer sees all shares; each participant sees the total and their own row.
            FHE.allow(total, participant);
            FHE.allowThis(share);
            FHE.allow(share, msg.sender);
            FHE.allow(share, participant);

            _addOwed(groupId, participant, share);

            if (participant == msg.sender) {
                _shareSettled[expenseId][participant] = true;
            }
        }

        emit ExpenseRecorded(groupId, expenseId, msg.sender);
    }

    /// @notice Payer marks a participant's share as paid back for this expense.
    function markShareSettled(uint256 expenseId, address participant) external {
        ExpenseMeta storage meta = _expenses[expenseId];
        if (!meta.exists) revert ExpenseMissing();
        if (meta.payer != msg.sender) revert OnlyPayer();
        if (_shareSettled[expenseId][participant]) revert AlreadySettled();

        _shareSettled[expenseId][participant] = true;
        emit ExpenseShareSettled(expenseId, participant);
    }

    function paidOf(uint256 groupId, address member) external view returns (euint64) {
        return _paid[groupId][member];
    }

    function owedOf(uint256 groupId, address member) external view returns (euint64) {
        return _owed[groupId][member];
    }

    function expensePayer(uint256 expenseId) external view returns (address) {
        return _expenses[expenseId].payer;
    }

    function expenseGroupId(uint256 expenseId) external view returns (uint256) {
        return _expenses[expenseId].groupId;
    }

    function expenseTotal(uint256 expenseId) external view returns (euint64) {
        return _expenses[expenseId].total;
    }

    function expenseParticipantCount(uint256 expenseId) external view returns (uint256) {
        return _expenseParticipants[expenseId].length;
    }

    function expenseParticipantAt(uint256 expenseId, uint256 index) external view returns (address) {
        return _expenseParticipants[expenseId][index];
    }

    function expenseShareOf(uint256 expenseId, address participant) external view returns (euint64) {
        return _expenseShare[expenseId][participant];
    }

    function isShareSettled(uint256 expenseId, address participant) external view returns (bool) {
        return _shareSettled[expenseId][participant];
    }

    function _addPaid(uint256 groupId, address who, euint64 amount) private {
        euint64 next = FHE.add(_paid[groupId][who], amount);
        _paid[groupId][who] = next;
        FHE.allowThis(next);
        FHE.allow(next, who);
    }

    function _addOwed(uint256 groupId, address who, euint64 amount) private {
        euint64 next = FHE.add(_owed[groupId][who], amount);
        _owed[groupId][who] = next;
        FHE.allowThis(next);
        FHE.allow(next, who);
    }
}
