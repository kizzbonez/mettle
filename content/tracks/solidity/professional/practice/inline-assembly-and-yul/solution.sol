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

    uint256 private constant MILLIS_MASK = 0xffffffffffffffff; // 64 bits
    uint256 private constant GATE_MASK = 0xff; // 8 bits
    uint256 private constant RIDER_MASK = 0xffffffff; // 32 bits

    /// @notice Packs a result into one word. The ABI decoder has already checked that each
    /// argument fits its type, so no bits need cleaning here.
    function pack(uint32 rider, uint8 gate, uint64 millis) external pure returns (uint256 word) {
        assembly ("memory-safe") {
            word := or(or(shl(72, rider), shl(64, gate)), millis)
        }
    }

    /// @notice The rider number of a result word.
    function riderOf(uint256 word) external pure returns (uint256 rider) {
        assembly ("memory-safe") {
            rider := and(shr(72, word), RIDER_MASK) // drop the timing system's bits above 103
        }
    }

    /// @notice The gate of a result word.
    function gateOf(uint256 word) external pure returns (uint256 gate) {
        assembly ("memory-safe") {
            gate := and(shr(64, word), GATE_MASK) // drop the rider above the gate
        }
    }

    /// @notice The time in milliseconds of a result word.
    function millisOf(uint256 word) external pure returns (uint256 millis) {
        assembly ("memory-safe") {
            millis := and(word, MILLIS_MASK)
        }
    }

    /// @notice The highest gate whose bit is set in `passed`. Reverts with NoGates() for 0.
    function highestGate(uint256 passed) external pure returns (uint256 gate) {
        bytes4 selector = NoGates.selector;
        assembly ("memory-safe") {
            if iszero(passed) {
                mstore(0x00, selector)
                revert(0x00, 0x04)
            }
            gate := sub(255, clz(passed)) // clz is 0 to 255 here, so no wrap-around
        }
    }

    /// @notice The sum of the times of every word. Reverts with TimeOverflow() when the sum no
    /// longer fits in 64 bits.
    function totalMillis(uint256[] calldata words) external pure returns (uint256 total) {
        bytes4 selector = TimeOverflow.selector;
        assembly ("memory-safe") {
            for { let i := 0 } lt(i, words.length) { i := add(i, 1) } {
                let word := calldataload(add(words.offset, shl(5, i))) // offset + 32 * i
                // Each time is below 2**64 and so is the total so far: the sum cannot wrap.
                total := add(total, and(word, MILLIS_MASK))
                if gt(total, MILLIS_MASK) {
                    mstore(0x00, selector)
                    revert(0x00, 0x04)
                }
            }
        }
    }
}
