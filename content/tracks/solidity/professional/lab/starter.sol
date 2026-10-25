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
        // Task 1: protect the implementation itself.
    }

    // Task 1
    function initialize(IERC20 asset_, address owner_, address treasury_, uint16 exitFeeBps_) external initializer {
        revert("not implemented: initialize");
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

    // Task 2
    function setExitFee(uint16 bps) external {
        revert("not implemented: setExitFee");
    }

    // Task 2
    function _authorizeUpgrade(address) internal view override {
        revert("not implemented: _authorizeUpgrade");
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

    // Task 3
    function _convertToShares(uint256 assets, Math.Rounding rounding) internal view returns (uint256) {
        revert("not implemented: _convertToShares");
    }

    // Task 3
    function _convertToAssets(uint256 shares, Math.Rounding rounding) internal view returns (uint256) {
        revert("not implemented: _convertToAssets");
    }

    // Task 4
    function previewDeposit(uint256 assets) public view returns (uint256) {
        revert("not implemented: previewDeposit");
    }

    function previewMint(uint256 shares) public view returns (uint256) {
        revert("not implemented: previewMint");
    }

    function previewWithdraw(uint256 assets) public view returns (uint256) {
        revert("not implemented: previewWithdraw");
    }

    function previewRedeem(uint256 shares) public view returns (uint256) {
        revert("not implemented: previewRedeem");
    }

    function maxDeposit(address) public view virtual returns (uint256) {
        return type(uint256).max;
    }

    function maxMint(address) public view virtual returns (uint256) {
        return type(uint256).max;
    }

    /// @notice What `owner_` receives by redeeming every share, after the exit fee.
    function maxWithdraw(address owner_) public view returns (uint256) {
        return previewRedeem(_vault().balances[owner_]);
    }

    function maxRedeem(address owner_) public view returns (uint256) {
        return _vault().balances[owner_];
    }

    // ---------------------------------------------------------------- ERC-4626 actions

    // Task 5
    function deposit(uint256 assets, address receiver) external returns (uint256 shares) {
        revert("not implemented: deposit");
    }

    function mint(uint256 shares, address receiver) external returns (uint256 assets) {
        revert("not implemented: mint");
    }

    function withdraw(uint256 assets, address receiver, address owner_) external returns (uint256 shares) {
        revert("not implemented: withdraw");
    }

    function redeem(uint256 shares, address receiver, address owner_) external returns (uint256 assets) {
        revert("not implemented: redeem");
    }

    // ---------------------------------------------------------------- the share token (ERC-20), complete

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

/// @notice Task 6: version 2 adds a deposit cap, in a namespace of its own.
contract TeaVaultV2 is TeaVaultV1 {
    /// @custom:storage-location erc7201:mettle.storage.TeaVaultV2
    struct CapStorage {
        uint256 depositCap;
    }

    bytes32 private constant CAP_STORAGE = bytes32(erc7201("mettle.storage.TeaVaultV2"));

    event DepositCapChanged(uint256 cap);

    function initializeV2(uint256 cap) external reinitializer(2) {
        revert("not implemented: initializeV2");
    }

    function depositCap() public view returns (uint256) {
        return _cap().depositCap;
    }

    function version() public pure override returns (uint256) {
        revert("not implemented: version");
    }

    function maxDeposit(address) public view override returns (uint256) {
        revert("not implemented: maxDeposit");
    }

    function maxMint(address receiver) public view override returns (uint256) {
        revert("not implemented: maxMint");
    }

    function _cap() private pure returns (CapStorage storage $) {
        bytes32 slot = CAP_STORAGE;
        assembly {
            $.slot := slot
        }
    }
}
