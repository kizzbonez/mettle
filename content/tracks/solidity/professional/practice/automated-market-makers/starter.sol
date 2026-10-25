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

    /// @notice Task 1: what `amountIn` buys from reserves `reserveIn` and `reserveOut`, after the
    /// fee, rounded down.
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure returns (uint256) {
        revert("not implemented: getAmountOut");
    }

    /// @notice Task 2: sells exactly `amountIn` of `tokenIn` for the other credit.
    function swap(address tokenIn, uint256 amountIn, uint256 minAmountOut, uint256 deadline)
        external
        returns (uint256 amountOut)
    {
        revert("not implemented: swap");
    }

    /// @notice Task 3: burns `shares` for the caller's part of both reserves.
    function removeLiquidity(uint256 shares, uint256 minWater, uint256 minCompost, uint256 deadline)
        external
        returns (uint256 waterOut, uint256 compostOut)
    {
        revert("not implemented: removeLiquidity");
    }
}
