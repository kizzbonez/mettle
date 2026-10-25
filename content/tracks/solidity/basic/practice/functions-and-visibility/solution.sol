// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Check-in for the Corrie Hut, a mountain refuge
/// @notice Each party's leader checks the whole party in from their own
/// account. Bunks are handed out in order, starting with bunk 1.
contract HutBunks {
    /// @notice The hut warden: the account that deployed the contract.
    address public immutable warden;

    /// @notice How many bunks the hut has.
    uint256 public immutable bunks;

    /// @notice How many bunks are taken tonight.
    uint256 public taken;

    /// @notice The leader of the party that checked in last.
    address public lastLeader;

    constructor(uint256 totalBunks) {
        warden = msg.sender;
        bunks = totalBunks;
    }

    /// @notice Checks in a party of `party` guests, the caller (its leader) included.
    /// @return first The number of the party's first bunk.
    /// @return left The bunks still free once the party has checked in.
    function checkIn(uint256 party) external returns (uint256 first, uint256 left) {
        // The party gets the next bunks in order, after those already taken.
        first = taken + 1;
        taken = taken + party;
        // msg.sender is the account that made this call: the party's leader.
        lastLeader = msg.sender;
        // An internal call to the public view function, made after taking the bunks.
        left = freeBunks();
    }

    /// @notice The bunks still free.
    function freeBunks() public view returns (uint256) {
        return bunks - taken;
    }
}
