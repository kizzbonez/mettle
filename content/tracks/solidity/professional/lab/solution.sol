// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

/// @notice The tea estate co-op's savings vault: pickers deposit LEAF and receive vault shares.
/// An exit fee on withdrawals goes to the co-op's treasury. It runs behind an ERC1967Proxy and is
/// upgraded with UUPS; all state lives in ERC-7201 namespaces.
contract TeaVaultV1 is Initializable, UUPSUpgradeable, IERC4626 {
    using SafeERC20 for IERC20;
    using Math for uint256;

    /// @custom:storage-location erc7201:mettle.storage.TeaVault
    struct VaultStorage {
        IERC20 asset;
        uint8 assetDecimals;
        address owner;
        address treasury;
        uint16 exitFeeBps;
        uint256 totalSupply;
        mapping(address account => uint256) balances;
        mapping(address account => mapping(address spender => uint256)) allowances;
    }

    bytes32 private constant VAULT_STORAGE = bytes32(erc7201("mettle.storage.TeaVault"));
    uint8 public constant DECIMALS_OFFSET = 3;
    uint16 public constant MAX_EXIT_FEE_BPS = 200;
    uint256 private constant BPS = 10_000;

    event ExitFeeChanged(uint16 previousBps, uint16 newBps);

    error NotOwner(address caller);
    error ZeroAddress();
    error FeeTooHigh(uint16 bps, uint16 max);
    error ERC4626ExceededMaxDeposit(address receiver, uint256 assets, uint256 max);
    error ERC4626ExceededMaxMint(address receiver, uint256 shares, uint256 max);
    error ERC4626ExceededMaxWithdraw(address owner, uint256 assets, uint256 max);
    error ERC4626ExceededMaxRedeem(address owner, uint256 shares, uint256 max);
    error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed);
    error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers(); // nobody may initialize the implementation itself
    }

    /// @notice Sets the vault up behind its proxy. Runs once.
    function initialize(IERC20 asset_, address owner_, address treasury_, uint16 exitFeeBps_) external initializer {
        if (address(asset_) == address(0) || owner_ == address(0) || treasury_ == address(0)) {
            revert ZeroAddress();
        }
        if (exitFeeBps_ > MAX_EXIT_FEE_BPS) revert FeeTooHigh(exitFeeBps_, MAX_EXIT_FEE_BPS);
        VaultStorage storage $ = _vault();
        $.asset = asset_;
        $.assetDecimals = IERC20Metadata(address(asset_)).decimals();
        $.owner = owner_;
        $.treasury = treasury_;
        $.exitFeeBps = exitFeeBps_;
    }

    // ---------------------------------------------------------------- administration

    function owner() public view returns (address) {
        return _vault().owner;
    }

    function treasury() public view returns (address) {
        return _vault().treasury;
    }

    function exitFeeBps() public view returns (uint16) {
        return _vault().exitFeeBps;
    }

    function version() public pure virtual returns (uint256) {
        return 1;
    }

    /// @notice Changes the exit fee, up to MAX_EXIT_FEE_BPS. Owner only.
    function setExitFee(uint16 bps) external {
        VaultStorage storage $ = _vault();
        if (msg.sender != $.owner) revert NotOwner(msg.sender);
        if (bps > MAX_EXIT_FEE_BPS) revert FeeTooHigh(bps, MAX_EXIT_FEE_BPS);
        emit ExitFeeChanged($.exitFeeBps, bps);
        $.exitFeeBps = bps;
    }

    function _authorizeUpgrade(address) internal view override {
        if (msg.sender != _vault().owner) revert NotOwner(msg.sender);
    }

    // ---------------------------------------------------------------- ERC-4626 accounting

    function asset() public view returns (address) {
        return address(_vault().asset);
    }

    function totalAssets() public view returns (uint256) {
        return _vault().asset.balanceOf(address(this));
    }

    function convertToShares(uint256 assets) public view returns (uint256) {
        return _convertToShares(assets, Math.Rounding.Floor);
    }

    function convertToAssets(uint256 shares) public view returns (uint256) {
        return _convertToAssets(shares, Math.Rounding.Floor);
    }

    /// @dev Virtual shares and assets: as if the vault always held 10**DECIMALS_OFFSET more
    /// shares and 1 more asset, so a donation to an empty vault cannot steal later deposits.
    function _convertToShares(uint256 assets, Math.Rounding rounding) internal view returns (uint256) {
        return assets.mulDiv(_vault().totalSupply + 10 ** DECIMALS_OFFSET, totalAssets() + 1, rounding);
    }

    function _convertToAssets(uint256 shares, Math.Rounding rounding) internal view returns (uint256) {
        return shares.mulDiv(totalAssets() + 1, _vault().totalSupply + 10 ** DECIMALS_OFFSET, rounding);
    }

    // Paying out rounds down, charging the user rounds up; the exit fee always rounds up.

    function previewDeposit(uint256 assets) public view returns (uint256) {
        return _convertToShares(assets, Math.Rounding.Floor);
    }

    function previewMint(uint256 shares) public view returns (uint256) {
        return _convertToAssets(shares, Math.Rounding.Ceil);
    }

    function previewWithdraw(uint256 assets) public view returns (uint256) {
        uint256 fee = _feeOnRaw(assets);
        return _convertToShares(assets + fee, Math.Rounding.Ceil);
    }

    function previewRedeem(uint256 shares) public view returns (uint256) {
        uint256 assets = _convertToAssets(shares, Math.Rounding.Floor);
        return assets - _feeOnTotal(assets);
    }

    /// @dev The fee on top of `assets` that a withdrawal of `assets` pays.
    function _feeOnRaw(uint256 assets) internal view returns (uint256) {
        return assets.mulDiv(_vault().exitFeeBps, BPS, Math.Rounding.Ceil);
    }

    /// @dev The part of `assets` that is the fee, when `assets` already includes it.
    function _feeOnTotal(uint256 assets) internal view returns (uint256) {
        uint256 bps = _vault().exitFeeBps;
        return assets.mulDiv(bps, bps + BPS, Math.Rounding.Ceil);
    }

    function maxDeposit(address) public view virtual returns (uint256) {
        return type(uint256).max;
    }

    function maxMint(address) public view virtual returns (uint256) {
        return type(uint256).max;
    }

    function maxWithdraw(address owner_) public view returns (uint256) {
        return previewRedeem(_vault().balances[owner_]);
    }

    function maxRedeem(address owner_) public view returns (uint256) {
        return _vault().balances[owner_];
    }

    // ---------------------------------------------------------------- ERC-4626 actions

    function deposit(uint256 assets, address receiver) external returns (uint256 shares) {
        uint256 max = maxDeposit(receiver);
        if (assets > max) revert ERC4626ExceededMaxDeposit(receiver, assets, max);
        shares = previewDeposit(assets);
        _deposit(receiver, assets, shares);
    }

    function mint(uint256 shares, address receiver) external returns (uint256 assets) {
        uint256 max = maxMint(receiver);
        if (shares > max) revert ERC4626ExceededMaxMint(receiver, shares, max);
        assets = previewMint(shares);
        _deposit(receiver, assets, shares);
    }

    function withdraw(uint256 assets, address receiver, address owner_) external returns (uint256 shares) {
        uint256 max = maxWithdraw(owner_);
        if (assets > max) revert ERC4626ExceededMaxWithdraw(owner_, assets, max);
        shares = previewWithdraw(assets);
        _withdraw(receiver, owner_, assets, shares, _feeOnRaw(assets));
    }

    function redeem(uint256 shares, address receiver, address owner_) external returns (uint256 assets) {
        uint256 max = maxRedeem(owner_);
        if (shares > max) revert ERC4626ExceededMaxRedeem(owner_, shares, max);
        uint256 gross = _convertToAssets(shares, Math.Rounding.Floor);
        uint256 fee = _feeOnTotal(gross);
        assets = gross - fee;
        _withdraw(receiver, owner_, assets, shares, fee);
    }

    /// @dev Pull the assets first, then mint: a reentrant token cannot mint shares unpaid.
    function _deposit(address receiver, uint256 assets, uint256 shares) internal {
        _vault().asset.safeTransferFrom(msg.sender, address(this), assets);
        _mint(receiver, shares);
        emit Deposit(msg.sender, receiver, assets, shares);
    }

    /// @dev Burn first, then pay: checks-effects-interactions.
    function _withdraw(address receiver, address owner_, uint256 assets, uint256 shares, uint256 fee) internal {
        if (msg.sender != owner_) _spendAllowance(owner_, msg.sender, shares);
        _burn(owner_, shares);
        VaultStorage storage $ = _vault();
        if (fee > 0) $.asset.safeTransfer($.treasury, fee);
        $.asset.safeTransfer(receiver, assets);
        emit Withdraw(msg.sender, receiver, owner_, assets, shares);
    }

    // ---------------------------------------------------------------- the share token (ERC-20)

    function name() public pure returns (string memory) {
        return "Tea Estate Vault";
    }

    function symbol() public pure returns (string memory) {
        return "vLEAF";
    }

    function decimals() public view returns (uint8) {
        return _vault().assetDecimals + DECIMALS_OFFSET;
    }

    function totalSupply() public view returns (uint256) {
        return _vault().totalSupply;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _vault().balances[account];
    }

    function allowance(address holder, address spender) public view returns (uint256) {
        return _vault().allowances[holder][spender];
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        _vault().allowances[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        _spendAllowance(from, msg.sender, value);
        _transfer(from, to, value);
        return true;
    }

    function _transfer(address from, address to, uint256 value) internal {
        if (to == address(0)) revert ZeroAddress();
        VaultStorage storage $ = _vault();
        uint256 balance = $.balances[from];
        if (balance < value) revert ERC20InsufficientBalance(from, balance, value);
        unchecked {
            $.balances[from] = balance - value;
        }
        $.balances[to] += value;
        emit Transfer(from, to, value);
    }

    function _mint(address to, uint256 value) internal {
        VaultStorage storage $ = _vault();
        $.totalSupply += value;
        $.balances[to] += value;
        emit Transfer(address(0), to, value);
    }

    function _burn(address from, uint256 value) internal {
        VaultStorage storage $ = _vault();
        uint256 balance = $.balances[from];
        if (balance < value) revert ERC20InsufficientBalance(from, balance, value);
        unchecked {
            $.balances[from] = balance - value;
            $.totalSupply -= value;
        }
        emit Transfer(from, address(0), value);
    }

    function _spendAllowance(address holder, address spender, uint256 value) internal {
        VaultStorage storage $ = _vault();
        uint256 current = $.allowances[holder][spender];
        if (current == type(uint256).max) return;
        if (current < value) revert ERC20InsufficientAllowance(spender, current, value);
        unchecked {
            $.allowances[holder][spender] = current - value;
        }
    }

    function _vault() internal pure returns (VaultStorage storage $) {
        bytes32 slot = VAULT_STORAGE;
        assembly {
            $.slot := slot
        }
    }
}

/// @notice Version 2 adds a deposit cap, in a namespace of its own.
contract TeaVaultV2 is TeaVaultV1 {
    /// @custom:storage-location erc7201:mettle.storage.TeaVaultV2
    struct CapStorage {
        uint256 depositCap;
    }

    bytes32 private constant CAP_STORAGE = bytes32(erc7201("mettle.storage.TeaVaultV2"));

    event DepositCapChanged(uint256 cap);

    /// @notice Runs once, inside the owner's upgradeToAndCall.
    function initializeV2(uint256 cap) external reinitializer(2) {
        if (msg.sender != owner()) revert NotOwner(msg.sender);
        _cap().depositCap = cap;
        emit DepositCapChanged(cap);
    }

    function depositCap() public view returns (uint256) {
        return _cap().depositCap;
    }

    function version() public pure override returns (uint256) {
        return 2;
    }

    /// @notice What can still be deposited before the vault holds `depositCap` assets.
    function maxDeposit(address) public view override returns (uint256) {
        uint256 cap = _cap().depositCap;
        uint256 held = totalAssets();
        return held >= cap ? 0 : cap - held;
    }

    function maxMint(address receiver) public view override returns (uint256) {
        return previewDeposit(maxDeposit(receiver));
    }

    function _cap() private pure returns (CapStorage storage $) {
        bytes32 slot = CAP_STORAGE;
        assembly {
            $.slot := slot
        }
    }
}
