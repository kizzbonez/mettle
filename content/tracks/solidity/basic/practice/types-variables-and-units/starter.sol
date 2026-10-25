// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Pay for the lavender pickers at Long Acre Farm
/// @notice The pickers cut lavender in two shifts a day as one team, and
/// share the day's pay equally.
contract HarvestDay {
    /// @notice What the farm pays for one bundle of lavender, in wei.
    uint256 public constant BUNDLE_PRICE = 0.004 ether;

    /// @notice How long each of the day's two shifts lasts, in seconds.
    uint256 public constant SHIFT = 4 hours;

    /// @notice The farm's account, fixed when the contract is deployed.
    address public immutable farm;

    constructor() {
        farm = msg.sender;
    }

    /// @notice One picker's share of a day's pay, in wei.
    /// @param morning Bundles the team cut in the morning shift (0 to 255).
    /// @param afternoon Bundles the team cut in the afternoon shift (0 to 255).
    /// @param pickers How many pickers share the pay (1 to 255).
    function share(uint8 morning, uint8 afternoon, uint8 pickers) public pure returns (uint256) {
        // YOUR CODE: add up the day's bundles, multiply them by BUNDLE_PRICE,
        // then divide by pickers, as the instructions explain. Mind the type
        // of each step: 255 + 255 does not fit in a uint8. Then delete the
        // revert line.
        revert("not implemented: share");
    }
}
