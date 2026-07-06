// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Test} from "forge-std/Test.sol";
import {GroupRegistry} from "../src/GroupRegistry.sol";

contract GroupRegistryTest is Test {
    GroupRegistry internal registry;

    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal carol = makeAddr("carol");

    function setUp() public {
        registry = new GroupRegistry();
    }

    function _create() internal returns (uint256 id) {
        address[] memory initial = new address[](1);
        initial[0] = bob;
        vm.prank(alice);
        id = registry.createGroup(initial);
    }

    function test_createGroup_setsAdminAndMembers() public {
        uint256 id = _create();
        (address admin, bool exists) = registry.groups(id);
        assertEq(admin, alice);
        assertTrue(exists);
        assertTrue(registry.isMember(id, alice));
        assertTrue(registry.isMember(id, bob));
        assertEq(registry.memberCount(id), 2);
    }

    function test_addMember_onlyAdmin() public {
        uint256 id = _create();

        vm.prank(bob);
        vm.expectRevert(GroupRegistry.NotAdmin.selector);
        registry.addMember(id, carol);

        vm.prank(alice);
        registry.addMember(id, carol);
        assertTrue(registry.isMember(id, carol));
    }

    function test_removeMember_cannotRemoveAdmin() public {
        uint256 id = _create();
        vm.prank(alice);
        vm.expectRevert(GroupRegistry.CannotRemoveAdmin.selector);
        registry.removeMember(id, alice);
    }

    function test_transferAdmin() public {
        uint256 id = _create();
        vm.prank(alice);
        registry.transferAdmin(id, bob);
        (address admin,) = registry.groups(id);
        assertEq(admin, bob);
    }

    function test_transferAdmin_requiresMember() public {
        uint256 id = _create();
        vm.prank(alice);
        vm.expectRevert(GroupRegistry.NotAMember.selector);
        registry.transferAdmin(id, carol);
    }
}
