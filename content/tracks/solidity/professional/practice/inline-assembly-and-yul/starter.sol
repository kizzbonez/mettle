// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Split times of a hill-climb race, packed into single words.
/// A result word holds, from the lowest bit up:
///   bits  0..63   millis: the rider's time in milliseconds
///   bits 64..71   gate:   the timing gate where the time was taken, 0 to 255
///   bits 72..103  rider:  the rider's number
/// Every bit above 103 is ignored when a word is read: the timing system uses them for itself.
contract HillClimbTimes {
    error NoGates();
    error TimeOverflow();

    /// @notice Task 1: packs a result into one word, in assembly.
    function pack(uint32 rider, uint8 gate, uint64 millis) external pure returns (uint256 word) {
        revert("not implemented: pack");
    }

    /// @notice Task 2: the rider number of a result word, in assembly.
    function riderOf(uint256 word) external pure returns (uint256 rider) {
        revert("not implemented: riderOf");
    }

    /// @notice Task 2: the gate of a result word, in assembly.
    function gateOf(uint256 word) external pure returns (uint256 gate) {
        revert("not implemented: gateOf");
    }

    /// @notice Task 2: the time in milliseconds of a result word, in assembly.
    function millisOf(uint256 word) external pure returns (uint256 millis) {
        revert("not implemented: millisOf");
    }

    /// @notice Task 3: the highest gate whose bit is set in `passed`, with clz.
    function highestGate(uint256 passed) external pure returns (uint256 gate) {
        revert("not implemented: highestGate");
    }

    /// @notice Task 4: the sum of the times of every word, in a Yul loop over calldata.
    function totalMillis(uint256[] calldata words) external pure returns (uint256 total) {
        revert("not implemented: totalMillis");
    }
}
