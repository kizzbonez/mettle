// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";

/// @title Granary shares
/// @notice A grain co-op's maintenance fund. Members deposit ether and receive shares of the
/// fund; redeeming shares pays back a proportional amount of the ether held.
/// @dev Three arithmetic flaws let a member take more than their share, lose precision, or
/// corrupt the share ledger. Find and fix them. `Math` and `SafeCast` are imported for you.
contract Granary {
    uint128 public totalShares;
    mapping(address member => uint128 shares) public sharesOf;

    event Deposited(address indexed member, uint256 assets, uint256 shares);
    event Redeemed(address indexed member, uint256 shares, uint256 assets);

    error ZeroDeposit();
    error ZeroShares();
    error InsufficientShares(uint256 held, uint256 wanted);
    error PaymentFailed();

    /// @notice Deposits `msg.value` and mints shares at the current price.
    function deposit() external payable returns (uint256 shares) {
        if (msg.value == 0) revert ZeroDeposit();
        uint256 assetsBefore = address(this).balance - msg.value;
        shares = totalShares == 0 ? msg.value : Math.mulDiv(msg.value, totalShares, assetsBefore);
        if (shares == 0) revert ZeroShares();
        sharesOf[msg.sender] += uint128(shares);
        totalShares += uint128(shares);
        emit Deposited(msg.sender, msg.value, shares);
    }

    /// @notice Redeems `shares` for a proportional amount of the fund's ether.
    function redeem(uint256 shares) external returns (uint256 assets) {
        assets = (shares / totalShares) * address(this).balance;
        unchecked {
            sharesOf[msg.sender] -= uint128(shares);
            totalShares -= uint128(shares);
        }
        emit Redeemed(msg.sender, shares, assets);
        (bool ok,) = msg.sender.call{value: assets}("");
        if (!ok) revert PaymentFailed();
    }

    function totalAssets() external view returns (uint256) {
        return address(this).balance;
    }
}
