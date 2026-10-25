// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Your first lab: a contract that counts the places sold for one evening's
// lantern cruise on the canal.
//
// How a lab works:
//  1. Press Run. The contract is compiled, then the first test deploys it on a
//     local test chain, calls its functions and checks what they return.
//  2. Read the test's message. It says what was checked, then shows two
//     values: what the contract returned, and what the test expected.
//  3. Make the one change the instructions ask for, on the line marked CHANGE.
//  4. Press Run again. When the test passes, press Submit, which also runs
//     the hidden tests.
//
// Two slashes // make the rest of a line a comment, which the compiler skips.

/// @notice Counts the places sold for one evening's lantern cruise.
contract LanternCruise {
    // The boat's name. A string is a piece of text.
    string public constant BOAT = "Kingfisher";

    // CHANGE the number on the next line: the new boat seats 40 passengers, not 30.
    uint256 public constant SEATS = 40;

    // How many places have been sold so far. It starts at 0.
    uint256 public sold;

    // What the contract stops with when a booking asks for more seats than
    // are left. It names the seats asked for and the seats left.
    error NotEnoughSeats(uint256 asked, uint256 left);

    /// @notice Sells `count` places, or stops with NotEnoughSeats and changes nothing.
    function book(uint256 count) external {
        uint256 left = SEATS - sold;
        if (count > left) {
            revert NotEnoughSeats(count, left);
        }
        sold = sold + count;
    }

    /// @notice How many seats are still free.
    function seatsLeft() external view returns (uint256) {
        return SEATS - sold;
    }
}
