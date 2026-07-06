// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {GroupRegistry} from "./GroupRegistry.sol";

/// @title Settlements
/// @notice Private, participant-scoped settlement instructions between a payer and payee.
/// @dev The encrypted amount is ACL-authorized to the payer and payee ONLY. There is no
///      group-wide debt board: non-parties can see that a settlement exists (addresses,
///      paid flag) but never the amount.
contract Settlements is ZamaEthereumConfig {
    GroupRegistry public immutable registry;

    struct Settlement {
        uint256 groupId;
        address payer;
        address payee;
        euint64 amount;
        bool paid;
        bool exists;
    }

    uint256 public nextSettlementId = 1;
    mapping(uint256 settlementId => Settlement) private _settlements;

    event SettlementCreated(uint256 indexed settlementId, uint256 indexed groupId, address indexed payer, address payee);
    event SettlementPaid(uint256 indexed settlementId);

    error NotGroupMember(address who);
    error SettlementMissing();
    error OnlyPayer();
    error AlreadyPaid();

    constructor(GroupRegistry _registry) {
        registry = _registry;
    }

    /// @notice Create a settlement instruction: caller (payer) will pay `payee` an encrypted amount.
    function createSettlement(
        uint256 groupId,
        address payee,
        externalEuint64 encAmount,
        bytes calldata inputProof
    ) external returns (uint256 settlementId) {
        if (!registry.isMember(groupId, msg.sender)) revert NotGroupMember(msg.sender);
        if (!registry.isMember(groupId, payee)) revert NotGroupMember(payee);

        euint64 amount = FHE.fromExternal(encAmount, inputProof);
        FHE.allowThis(amount);
        FHE.allow(amount, msg.sender);
        FHE.allow(amount, payee);

        settlementId = nextSettlementId++;
        _settlements[settlementId] = Settlement({
            groupId: groupId,
            payer: msg.sender,
            payee: payee,
            amount: amount,
            paid: false,
            exists: true
        });

        emit SettlementCreated(settlementId, groupId, msg.sender, payee);
    }

    /// @notice Payer marks the settlement as paid (after transferring stablecoin off this contract).
    function markPaid(uint256 settlementId) external {
        Settlement storage s = _settlements[settlementId];
        if (!s.exists) revert SettlementMissing();
        if (s.payer != msg.sender) revert OnlyPayer();
        if (s.paid) revert AlreadyPaid();
        s.paid = true;
        emit SettlementPaid(settlementId);
    }

    /// @notice Encrypted amount handle. Decryptable by payer + payee only (enforced by ACL).
    function amountOf(uint256 settlementId) external view returns (euint64) {
        return _settlements[settlementId].amount;
    }

    function settlementInfo(uint256 settlementId)
        external
        view
        returns (uint256 groupId, address payer, address payee, bool paid, bool exists)
    {
        Settlement storage s = _settlements[settlementId];
        return (s.groupId, s.payer, s.payee, s.paid, s.exists);
    }
}
