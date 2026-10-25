// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";

/// @notice What the handler needs from a meal-credit contract.
interface IMealCredits {
    function PRICE() external view returns (uint256);
    function creditsOf(address member) external view returns (uint256);
    function totalCredits() external view returns (uint256);
    function kitchenEarnings() external view returns (uint256);
    function buy(uint256 count) external payable;
    function give(address to, uint256 count) external;
    function redeem(uint256 count) external;
    function refund(uint256 count) external;
}

/// @notice Meal credits at the community kitchen: buy them, give them to friends, eat (redeem)
/// or get the ether back (refund). Given; the invariant tests run against it.
contract MealCredits is IMealCredits {
    uint256 public constant PRICE = 0.01 ether;

    mapping(address member => uint256) public creditsOf;
    uint256 public totalCredits;
    uint256 public kitchenEarnings;

    error WrongPayment(uint256 expected, uint256 sent);
    error NotEnoughCredits(uint256 available, uint256 needed);
    error PaymentFailed();

    function buy(uint256 count) external payable {
        if (msg.value != count * PRICE) revert WrongPayment(count * PRICE, msg.value);
        creditsOf[msg.sender] += count;
        totalCredits += count;
    }

    function give(address to, uint256 count) external {
        _take(msg.sender, count);
        creditsOf[to] += count;
    }

    function redeem(uint256 count) external {
        _take(msg.sender, count);
        totalCredits -= count;
        kitchenEarnings += count * PRICE;
    }

    function refund(uint256 count) external {
        _take(msg.sender, count);
        totalCredits -= count;
        (bool ok,) = msg.sender.call{value: count * PRICE}("");
        if (!ok) revert PaymentFailed();
    }

    function _take(address from, uint256 count) private {
        uint256 available = creditsOf[from];
        if (count > available) revert NotEnoughCredits(available, count);
        creditsOf[from] = available - count;
    }
}

/// @notice The handler the invariant tests give to the fuzzer: three actors, inputs bounded to
/// what each can afford, and ghost totals counted from the handler's own actions.
contract CreditsHandler is Test {
    IMealCredits public immutable credits;
    address[3] public actors = [address(0xC1), address(0xC2), address(0xC3)];

    uint256 public ghostBought;
    uint256 public ghostRedeemed;
    uint256 public ghostRefunded;

    constructor(IMealCredits credits_) {
        credits = credits_;
    }

    function buy(uint256 actorSeed, uint256 count) external {
        address actor = actors[actorSeed % 3];
        count = bound(count, 0, 20);
        uint256 cost = count * credits.PRICE();
        vm.deal(actor, cost);
        vm.prank(actor);
        credits.buy{value: cost}(count);
        ghostBought += count;
    }

    /// @dev `from` and `to` may be the same actor: the fuzzer must be able to try that too.
    function give(uint256 fromSeed, uint256 toSeed, uint256 count) external {
        address from = actors[fromSeed % 3];
        count = bound(count, 0, credits.creditsOf(from));
        vm.prank(from);
        credits.give(actors[toSeed % 3], count);
    }

    function redeem(uint256 actorSeed, uint256 count) external {
        address actor = actors[actorSeed % 3];
        count = bound(count, 0, credits.creditsOf(actor));
        vm.prank(actor);
        credits.redeem(count);
        ghostRedeemed += count;
    }

    function refund(uint256 actorSeed, uint256 count) external {
        address actor = actors[actorSeed % 3];
        count = bound(count, 0, credits.creditsOf(actor));
        vm.prank(actor);
        credits.refund(count);
        ghostRefunded += count;
    }

    /// @notice The credits the three actors hold, read from the contract.
    function sumOfCredits() external view returns (uint256 sum) {
        for (uint256 i = 0; i < 3; i++) {
            sum += credits.creditsOf(actors[i]);
        }
    }
}
