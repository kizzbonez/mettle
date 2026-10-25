// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";

/// @title Granary shares
/// @notice A grain co-op's maintenance fund. Members deposit ether and receive shares of the
/// fund; redeeming shares pays back a proportional amount of the ether held. Rounding always
/// favours the fund (members get the floor), so the fund can never pay out more than it holds.
contract Granary {
    using SafeCast for uint256;

    uint128 public totalShares;
    mapping(address member => uint128 shares) public sharesOf;

    event Deposited(address indexed member, uint256 assets, uint256 shares);
    event Redeemed(address indexed member, uint256 shares, uint256 assets);

    error ZeroDeposit();
    error ZeroShares();
    error InsufficientShares(uint256 held, uint256 wanted);
    error PaymentFailed();

    /// @notice Deposits `msg.value` and mints shares at the current price (floor).
    function deposit() external payable returns (uint256 shares) {
        if (msg.value == 0) revert ZeroDeposit();
        uint256 assetsBefore = address(this).balance - msg.value;
        // First deposit: one share per wei. Later: value * totalShares / assetsBefore, rounded
        // down. Multiply before dividing, and with 512-bit intermediate maths (Math.mulDiv).
        shares = totalShares == 0 ? msg.value : Math.mulDiv(msg.value, totalShares, assetsBefore);
        if (shares == 0) revert ZeroShares();
        sharesOf[msg.sender] += shares.toUint128(); // reverts instead of truncating
        totalShares += shares.toUint128();
        emit Deposited(msg.sender, msg.value, shares);
    }

    /// @notice Redeems `shares` for a proportional amount of the fund's ether (floor).
    function redeem(uint256 shares) external returns (uint256 assets) {
        uint256 held = sharesOf[msg.sender];
        if (shares > held) revert InsufficientShares(held, shares);
        // shares * balance / totalShares, rounded down: the dust stays in the fund.
        assets = Math.mulDiv(shares, address(this).balance, totalShares);
        sharesOf[msg.sender] = (held - shares).toUint128();
        totalShares -= shares.toUint128();
        emit Redeemed(msg.sender, shares, assets);
        (bool ok,) = msg.sender.call{value: assets}("");
        if (!ok) revert PaymentFailed();
    }

    function totalAssets() external view returns (uint256) {
        return address(this).balance;
    }
}
