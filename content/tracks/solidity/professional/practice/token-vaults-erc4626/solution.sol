// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/// @notice The town band's instrument fund: members deposit band credits for shares. Leaving
/// costs a 0.5% exit fee for the repair kitty, and the fund holds at most `cap` credits, the
/// most its insurance covers.
contract BandFundVault is ERC4626 {
    using Math for uint256;

    uint256 public constant EXIT_FEE_BPS = 50; // 0.5%
    uint256 private constant BPS = 10_000;

    address public immutable treasury;
    uint256 public immutable cap;

    constructor(IERC20 credit, address treasury_, uint256 cap_) ERC20("Bandstand Fund Share", "BFS") ERC4626(credit) {
        treasury = treasury_;
        cap = cap_;
    }

    // ---- Task 1: virtual shares --------------------------------------------------------------

    /// @dev 1,000 virtual shares per virtual asset make a donation attack cost the attacker
    /// about a thousand times what it can take.
    function _decimalsOffset() internal pure override returns (uint8) {
        return 3;
    }

    // ---- Task 2: the cap ---------------------------------------------------------------------

    /// @notice How much credit can still be deposited. A donation may push the total past the
    /// cap, so this never subtracts below zero.
    function maxDeposit(address) public view override returns (uint256) {
        uint256 held = totalAssets();
        return held >= cap ? 0 : cap - held;
    }

    /// @notice The shares that the remaining room buys. previewDeposit rounds down, so minting
    /// this many never needs more credit than maxDeposit allows.
    function maxMint(address receiver) public view override returns (uint256) {
        return previewDeposit(maxDeposit(receiver));
    }

    // ---- Task 3: the exit fee ----------------------------------------------------------------

    /// @notice Shares burned to withdraw `assets` net: enough for the assets plus the fee,
    /// rounded up.
    function previewWithdraw(uint256 assets) public view override returns (uint256) {
        uint256 fee = _feeOnRaw(assets);
        return super.previewWithdraw(assets + fee);
    }

    /// @notice Credit received for `shares`, after the fee, rounded down.
    function previewRedeem(uint256 shares) public view override returns (uint256) {
        uint256 assets = super.previewRedeem(shares);
        return assets - _feeOnTotal(assets);
    }

    /// @dev Burns the shares, pays the member, then pays the fee to the treasury.
    function _withdraw(address caller, address receiver, address owner, uint256 assets, uint256 shares)
        internal
        override
    {
        uint256 fee = _feeOnRaw(assets);
        super._withdraw(caller, receiver, owner, assets, shares);
        if (fee > 0) SafeERC20.safeTransfer(IERC20(asset()), treasury, fee);
    }

    /// @dev The fee on an amount that does not include it yet: assets * 0.5%, rounded up.
    function _feeOnRaw(uint256 assets) private pure returns (uint256) {
        return assets.mulDiv(EXIT_FEE_BPS, BPS, Math.Rounding.Ceil);
    }

    /// @dev The part of a total that is fee: total * 50 / 10,050, rounded up.
    function _feeOnTotal(uint256 assets) private pure returns (uint256) {
        return assets.mulDiv(EXIT_FEE_BPS, EXIT_FEE_BPS + BPS, Math.Rounding.Ceil);
    }
}
