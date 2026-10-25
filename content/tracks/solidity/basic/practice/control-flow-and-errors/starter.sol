// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Pick-your-own baskets for one picking day at the blueberry field. Families reserve
/// baskets here and pay what they owe at the gate; the farmer closes the day at dusk.
contract BerryBaskets {
    uint256 public constant DAILY_LIMIT = 60;
    uint256 public constant MAX_PER_ORDER = 8;
    uint256 public constant FIRST_BASKET_PRICE = 0.01 ether;
    uint256 public constant FLOOR_PRICE = 0.006 ether;

    address public immutable farmer;
    uint256 public reserved; // baskets reserved today
    uint256 public owed; // wei owed at the gate for today's baskets

    error NoBaskets();
    error OrderTooLarge(uint256 requested, uint256 max);
    error SoldOut(uint256 left, uint256 requested);
    error NotFarmer(address caller);

    constructor() {
        farmer = msg.sender;
    }

    /// @notice The price of one order of `baskets` baskets, in wei.
    function priceOf(uint256 baskets) public pure returns (uint256 total) {
        // Task 1: check the order size, then add up the baskets' prices in a loop.
        revert("not implemented: priceOf");
    }

    /// @notice Reserves `baskets` baskets for today and returns what they cost.
    function reserve(uint256 baskets) external returns (uint256 cost) {
        // Task 2: the three checks, in order, then record the baskets and what they cost.
        revert("not implemented: reserve");
    }

    /// @notice Ends the picking day: returns the day's takings and starts the next day empty.
    function closeDay() external returns (uint256 takings) {
        // Task 3: only the farmer may close the day.
        revert("not implemented: closeDay");
    }
}
