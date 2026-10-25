// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/// @notice A constant-product pool between the allotment society's water credits and compost
/// credits. The pool's own ERC-20 is the liquidity share.
contract CreditPool is ERC20 {
    using SafeERC20 for IERC20;

    IERC20 public immutable water;
    IERC20 public immutable compost;
    uint256 public reserveWater;
    uint256 public reserveCompost;

    uint256 public constant FEE_BPS = 30; // 0.3% of every input stays in the pool
    uint256 public constant MINIMUM_LIQUIDITY = 1_000;
    address public constant LOCKED = address(0xdEaD);

    error ZeroAmount();
    error InsufficientLiquidity();
    error UnknownToken(address token);
    error Expired(uint256 deadline);
    error InsufficientOutput(uint256 amountOut, uint256 minAmountOut);
    error InsufficientShares(uint256 shares, uint256 minShares);

    event Swapped(address indexed trader, address indexed tokenIn, uint256 amountIn, uint256 amountOut);
    event LiquidityAdded(address indexed provider, uint256 waterAmount, uint256 compostAmount, uint256 shares);
    event LiquidityRemoved(address indexed provider, uint256 waterAmount, uint256 compostAmount, uint256 shares);

    constructor(IERC20 water_, IERC20 compost_) ERC20("Credit Pool Share", "CPS") {
        water = water_;
        compost = compost_;
    }

    modifier notExpired(uint256 deadline) {
        if (block.timestamp > deadline) revert Expired(deadline);
        _;
    }

    /// @notice Deposits both credits for pool shares. The first deposit locks MINIMUM_LIQUIDITY
    /// shares forever, so the pool can never be emptied and re-priced from nothing.
    function addLiquidity(uint256 waterAmount, uint256 compostAmount, uint256 minShares)
        external
        returns (uint256 shares)
    {
        uint256 supply = totalSupply();
        if (supply == 0) {
            shares = Math.sqrt(waterAmount * compostAmount) - MINIMUM_LIQUIDITY;
            _mint(LOCKED, MINIMUM_LIQUIDITY);
        } else {
            shares = Math.min(waterAmount * supply / reserveWater, compostAmount * supply / reserveCompost);
        }
        if (shares == 0 || shares < minShares) revert InsufficientShares(shares, minShares);
        reserveWater += waterAmount;
        reserveCompost += compostAmount;
        _mint(msg.sender, shares);
        water.safeTransferFrom(msg.sender, address(this), waterAmount);
        compost.safeTransferFrom(msg.sender, address(this), compostAmount);
        emit LiquidityAdded(msg.sender, waterAmount, compostAmount, shares);
    }

    /// @notice What `amountIn` buys from reserves `reserveIn` and `reserveOut`, after the fee,
    /// rounded down: (in * 9970) * reserveOut / (reserveIn * 10000 + in * 9970).
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure returns (uint256) {
        if (amountIn == 0) revert ZeroAmount();
        if (reserveIn == 0 || reserveOut == 0) revert InsufficientLiquidity();
        uint256 amountInWithFee = amountIn * (10_000 - FEE_BPS);
        return amountInWithFee * reserveOut / (reserveIn * 10_000 + amountInWithFee);
    }

    /// @notice Sells exactly `amountIn` of `tokenIn` for the other credit. Reverts after
    /// `deadline` or when the output would be below `minAmountOut`.
    function swap(address tokenIn, uint256 amountIn, uint256 minAmountOut, uint256 deadline)
        external
        notExpired(deadline)
        returns (uint256 amountOut)
    {
        bool waterIn = tokenIn == address(water);
        if (!waterIn && tokenIn != address(compost)) revert UnknownToken(tokenIn);
        (uint256 reserveIn, uint256 reserveOut) =
            waterIn ? (reserveWater, reserveCompost) : (reserveCompost, reserveWater);

        amountOut = getAmountOut(amountIn, reserveIn, reserveOut);
        if (amountOut < minAmountOut) revert InsufficientOutput(amountOut, minAmountOut);

        // Effects before interactions.
        if (waterIn) {
            reserveWater = reserveIn + amountIn;
            reserveCompost = reserveOut - amountOut;
        } else {
            reserveCompost = reserveIn + amountIn;
            reserveWater = reserveOut - amountOut;
        }
        (IERC20 inToken, IERC20 outToken) = waterIn ? (water, compost) : (compost, water);
        inToken.safeTransferFrom(msg.sender, address(this), amountIn);
        outToken.safeTransfer(msg.sender, amountOut);
        emit Swapped(msg.sender, tokenIn, amountIn, amountOut);
    }

    /// @notice Burns `shares` for the caller's part of both reserves, rounded down.
    function removeLiquidity(uint256 shares, uint256 minWater, uint256 minCompost, uint256 deadline)
        external
        notExpired(deadline)
        returns (uint256 waterOut, uint256 compostOut)
    {
        if (shares == 0) revert ZeroAmount();
        uint256 supply = totalSupply();
        waterOut = shares * reserveWater / supply;
        compostOut = shares * reserveCompost / supply;
        if (waterOut < minWater) revert InsufficientOutput(waterOut, minWater);
        if (compostOut < minCompost) revert InsufficientOutput(compostOut, minCompost);

        _burn(msg.sender, shares); // reverts if the caller holds fewer shares
        reserveWater -= waterOut;
        reserveCompost -= compostOut;
        water.safeTransfer(msg.sender, waterOut);
        compost.safeTransfer(msg.sender, compostOut);
        emit LiquidityRemoved(msg.sender, waterOut, compostOut, shares);
    }
}
