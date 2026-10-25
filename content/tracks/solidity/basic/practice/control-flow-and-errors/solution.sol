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
    /// @dev Each basket costs 10% less than the one before, never less than FLOOR_PRICE. The loop
    /// is bounded: an order has at most MAX_PER_ORDER baskets.
    function priceOf(uint256 baskets) public pure returns (uint256 total) {
        if (baskets == 0) revert NoBaskets();
        require(baskets <= MAX_PER_ORDER, OrderTooLarge(baskets, MAX_PER_ORDER));

        uint256 price = FIRST_BASKET_PRICE;
        for (uint256 i = 0; i < baskets; i++) {
            total += price;
            uint256 next = (price * 9) / 10;
            price = next < FLOOR_PRICE ? FLOOR_PRICE : next;
        }
    }

    /// @notice Reserves `baskets` baskets for today and returns what they cost.
    function reserve(uint256 baskets) external returns (uint256 cost) {
        // Checks first, in the order callers are promised.
        if (baskets == 0) revert NoBaskets();
        require(baskets <= MAX_PER_ORDER, OrderTooLarge(baskets, MAX_PER_ORDER));
        uint256 left = DAILY_LIMIT - reserved;
        require(baskets <= left, SoldOut(left, baskets));

        cost = priceOf(baskets);
        reserved += baskets;
        owed += cost;
        assert(reserved <= DAILY_LIMIT); // an invariant: false only if the checks above are wrong
    }

    /// @notice Ends the picking day: returns the day's takings and starts the next day empty.
    function closeDay() external returns (uint256 takings) {
        if (msg.sender != farmer) revert NotFarmer(msg.sender);
        takings = owed;
        reserved = 0;
        owed = 0;
    }
}
