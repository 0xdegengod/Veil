// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/// @title GroupRegistry
/// @notice On-chain membership + admin registry for Veil groups.
/// @dev Names and descriptions are intentionally kept OFF-chain (backend metadata).
///      Only membership and admin authority live here, since encrypted balances
///      in ConfidentialLedger are keyed by (groupId, member).
contract GroupRegistry {
    struct Group {
        address admin;
        bool exists;
    }

    uint256 public nextGroupId = 1;

    mapping(uint256 groupId => Group) public groups;
    mapping(uint256 groupId => address[]) private _members;
    mapping(uint256 groupId => mapping(address member => bool)) public isMember;

    event GroupCreated(uint256 indexed groupId, address indexed admin);
    event MemberAdded(uint256 indexed groupId, address indexed member);
    event MemberRemoved(uint256 indexed groupId, address indexed member);
    event AdminTransferred(uint256 indexed groupId, address indexed previousAdmin, address indexed newAdmin);

    error NotAdmin();
    error GroupMissing();
    error AlreadyMember();
    error NotAMember();
    error CannotRemoveAdmin();

    modifier onlyAdmin(uint256 groupId) {
        if (groups[groupId].admin != msg.sender) revert NotAdmin();
        _;
    }

    modifier groupExists(uint256 groupId) {
        if (!groups[groupId].exists) revert GroupMissing();
        _;
    }

    /// @notice Create a group with `msg.sender` as admin and initial members.
    /// @param initialMembers additional members to add (admin is added automatically).
    function createGroup(address[] calldata initialMembers) external returns (uint256 groupId) {
        groupId = nextGroupId++;
        groups[groupId] = Group({admin: msg.sender, exists: true});

        _addMember(groupId, msg.sender);
        for (uint256 i; i < initialMembers.length; ++i) {
            if (!isMember[groupId][initialMembers[i]]) {
                _addMember(groupId, initialMembers[i]);
            }
        }

        emit GroupCreated(groupId, msg.sender);
    }

    function addMember(uint256 groupId, address member)
        external
        groupExists(groupId)
        onlyAdmin(groupId)
    {
        if (isMember[groupId][member]) revert AlreadyMember();
        _addMember(groupId, member);
    }

    function removeMember(uint256 groupId, address member)
        external
        groupExists(groupId)
        onlyAdmin(groupId)
    {
        if (!isMember[groupId][member]) revert NotAMember();
        if (member == groups[groupId].admin) revert CannotRemoveAdmin();

        isMember[groupId][member] = false;
        address[] storage list = _members[groupId];
        uint256 len = list.length;
        for (uint256 i; i < len; ++i) {
            if (list[i] == member) {
                list[i] = list[len - 1];
                list.pop();
                break;
            }
        }
        emit MemberRemoved(groupId, member);
    }

    function transferAdmin(uint256 groupId, address newAdmin)
        external
        groupExists(groupId)
        onlyAdmin(groupId)
    {
        if (!isMember[groupId][newAdmin]) revert NotAMember();
        address previous = groups[groupId].admin;
        groups[groupId].admin = newAdmin;
        emit AdminTransferred(groupId, previous, newAdmin);
    }

    function members(uint256 groupId) external view returns (address[] memory) {
        return _members[groupId];
    }

    function memberCount(uint256 groupId) external view returns (uint256) {
        return _members[groupId].length;
    }

    function _addMember(uint256 groupId, address member) private {
        isMember[groupId][member] = true;
        _members[groupId].push(member);
        emit MemberAdded(groupId, member);
    }
}
