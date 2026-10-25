// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @notice The shape of a Chainlink-style price feed (AggregatorV3Interface).
interface IPriceFeed {
    function decimals() external view returns (uint8);
    function latestRoundData()
        external
        view
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}

/// @notice The co-op's own WATT/COIN pool: a constant-product market without fees.
/// @dev Given; do not change it. Its spot price is fine for swaps and useless as an oracle.
contract WattPool {
    using SafeERC20 for IERC20;

    IERC20 public immutable watt;
    IERC20 public immutable coin;
    uint256 public wattReserve;
    uint256 public coinReserve;

    constructor(IERC20 watt_, IERC20 coin_) {
        watt = watt_;
        coin = coin_;
    }

    /// @notice Adds WATT and COIN to the reserves.
    function addLiquidity(uint256 wattAmount, uint256 coinAmount) external {
        wattReserve += wattAmount;
        coinReserve += coinAmount;
        watt.safeTransferFrom(msg.sender, address(this), wattAmount);
        coin.safeTransferFrom(msg.sender, address(this), coinAmount);
    }

    /// @notice COIN per WATT at this moment, scaled by 1e18.
    function spotPrice() external view returns (uint256) {
        return coinReserve * 1e18 / wattReserve;
    }

    /// @notice Pays `coinIn` COIN into the pool and receives WATT.
    function buyWatt(uint256 coinIn) external returns (uint256 wattOut) {
        wattOut = wattReserve * coinIn / (coinReserve + coinIn);
        coinReserve += coinIn;
        wattReserve -= wattOut;
        coin.safeTransferFrom(msg.sender, address(this), coinIn);
        watt.safeTransfer(msg.sender, wattOut);
    }

    /// @notice Pays `wattIn` WATT into the pool and receives COIN.
    function sellWatt(uint256 wattIn) external returns (uint256 coinOut) {
        coinOut = coinReserve * wattIn / (wattReserve + wattIn);
        wattReserve += wattIn;
        coinReserve -= coinOut;
        watt.safeTransferFrom(msg.sender, address(this), wattIn);
        coin.safeTransfer(msg.sender, coinOut);
    }
}

/// @notice Lends COIN to members against the WATT they deposit, up to half its value.
contract CreditDesk {
    using SafeERC20 for IERC20;

    /// @notice The oldest feed answer the desk accepts: the feed's heartbeat plus a margin.
    uint256 public constant MAX_AGE = 1 hours;

    IERC20 public immutable watt;
    IERC20 public immutable coin;
    WattPool public immutable pool;
    IPriceFeed public immutable feed;

    mapping(address member => uint256) public collateral;
    mapping(address member => uint256) public debt;

    error StalePrice(uint256 updatedAt);
    error BadPrice(int256 answer);
    error OverLimit(uint256 requested, uint256 available);

    constructor(IERC20 watt_, IERC20 coin_, WattPool pool_, IPriceFeed feed_) {
        watt = watt_;
        coin = coin_;
        pool = pool_;
        feed = feed_;
    }

    /// @notice Deposits `amount` WATT as collateral.
    function deposit(uint256 amount) external {
        collateral[msg.sender] += amount;
        watt.safeTransferFrom(msg.sender, address(this), amount);
    }

    /// @notice Borrows `amount` COIN against the caller's collateral.
    function borrow(uint256 amount) external {
        uint256 available = maxBorrow(msg.sender);
        if (amount > available) revert OverLimit(amount, available);
        debt[msg.sender] += amount;
        coin.safeTransfer(msg.sender, amount);
    }

    /// @notice How much more COIN `member` may borrow: half the collateral's value, minus the debt.
    function maxBorrow(address member) public view returns (uint256) {
        uint256 limit = collateral[member] * wattPrice() / 1e18 / 2;
        return limit > debt[member] ? limit - debt[member] : 0;
    }

    /// @notice The pool's spot price, shown on the co-op's website. Never used for lending.
    function poolPrice() external view returns (uint256) {
        return pool.spotPrice();
    }

    /// @notice COIN per WATT from the price feed, scaled to 18 decimals.
    // TODO: read `feed` safely (see instructions.md). The old body, which priced WATT from the
    // pool and lost the desk most of its COIN in one transaction, was:
    //     return pool.spotPrice();
    function wattPrice() public view returns (uint256) {
        revert("not implemented: wattPrice");
    }
}
