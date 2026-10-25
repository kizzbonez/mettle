// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";

/// @notice The credit union's two roles: the owner (the board) and the treasurer.
abstract contract Roles {
    address public owner;
    address public treasurer;

    event TreasurerChanged(address indexed previous, address indexed next);

    error NotOwner(address caller);
    error NotTreasurer(address caller);

    constructor(address treasurer_) {
        owner = msg.sender;
        treasurer = treasurer_;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner(msg.sender);
        _;
    }

    modifier onlyTreasurer() {
        if (msg.sender != treasurer) revert NotTreasurer(msg.sender);
        _;
    }

    /// @notice Appoints a new treasurer. Only the board may: the treasurer signs bonuses.
    function setTreasurer(address next) external onlyOwner {
        emit TreasurerChanged(treasurer, next);
        treasurer = next;
    }

    function transferOwnership(address next) external onlyOwner {
        owner = next;
    }
}

/// @notice Members' savings in ether. Each deposit buys shares; interest raises what a share is worth.
/// @dev Share math rounds in the pool's favour: down when shares are issued, up when they are burned.
/// The pool tracks its assets itself and never trusts address(this).balance.
contract SavingsPool is Roles {
    uint256 public totalShares;
    uint256 public totalAssets;
    mapping(address member => uint256) public sharesOf;

    event Deposited(address indexed member, uint256 assets, uint256 shares);
    event Withdrawn(address indexed member, uint256 assets, uint256 shares);

    error ZeroShares();
    error InsufficientShares(uint256 available, uint256 needed);
    error NoMembers();
    error PaymentFailed();

    constructor(address treasurer_) Roles(treasurer_) {}

    function deposit() external payable returns (uint256) {
        return _deposit(msg.sender);
    }

    /// @notice Deposits the ether sent on behalf of `member` (the bonus desk uses this).
    function depositFor(address member) external payable returns (uint256) {
        return _deposit(member);
    }

    /// @notice Takes `assets` wei out of the caller's savings.
    function withdraw(uint256 assets) external returns (uint256 shares) {
        // Round up: a withdrawal never burns fewer shares than it is worth.
        shares = Math.mulDiv(assets, totalShares, totalAssets, Math.Rounding.Ceil);
        uint256 available = sharesOf[msg.sender];
        if (shares > available) revert InsufficientShares(available, shares);
        // Effects before the interaction: a reentrant call sees the reduced balance.
        sharesOf[msg.sender] = available - shares;
        totalShares -= shares;
        totalAssets -= assets;
        emit Withdrawn(msg.sender, assets, shares);
        (bool ok,) = msg.sender.call{value: assets}("");
        if (!ok) revert PaymentFailed();
    }

    /// @notice Adds interest earned elsewhere: every share becomes worth more.
    function addInterest() external payable onlyTreasurer {
        if (totalShares == 0) revert NoMembers();
        totalAssets += msg.value;
    }

    /// @notice What `member`'s shares are worth now, rounded down.
    function assetsOf(address member) external view returns (uint256) {
        if (totalShares == 0) return 0;
        return sharesOf[member] * totalAssets / totalShares;
    }

    function _deposit(address member) private returns (uint256 shares) {
        // Round down: a deposit never gets more shares than it pays for.
        shares = totalShares == 0 ? msg.value : msg.value * totalShares / totalAssets;
        if (shares == 0) revert ZeroShares();
        sharesOf[member] += shares;
        totalShares += shares;
        totalAssets += msg.value;
        emit Deposited(member, msg.value, shares);
    }
}

/// @notice Pays bonuses into members' savings, on EIP-712 vouchers the treasurer signs.
/// @dev A voucher is valid on this desk, on this chain, before its deadline, and once: each
/// member's vouchers carry consecutive nonces.
contract BonusDesk is Roles, EIP712, Nonces {
    bytes32 public constant BONUS_TYPEHASH =
        keccak256("Bonus(address member,uint256 amount,uint256 nonce,uint256 deadline)");

    SavingsPool public immutable pool;

    event BonusPaid(address indexed member, uint256 amount, uint256 nonce);

    error Expired(uint256 deadline);
    error WrongSigner(address recovered);

    constructor(SavingsPool pool_, address treasurer_) Roles(treasurer_) EIP712("BonusDesk", "1") {
        pool = pool_;
    }

    /// @notice The board funds the desk by sending it ether.
    receive() external payable {}

    /// @notice The EIP-712 digest the treasurer signs for a bonus voucher.
    function bonusDigest(address member, uint256 amount, uint256 nonce, uint256 deadline)
        public
        view
        returns (bytes32)
    {
        return _hashTypedDataV4(keccak256(abi.encode(BONUS_TYPEHASH, member, amount, nonce, deadline)));
    }

    /// @notice Deposits `amount` wei into `member`'s savings for a voucher signed by the treasurer.
    function claim(address member, uint256 amount, uint256 nonce, uint256 deadline, bytes calldata signature) external {
        if (block.timestamp > deadline) revert Expired(deadline);
        address signer = ECDSA.recover(bonusDigest(member, amount, nonce, deadline), signature);
        if (signer != treasurer) revert WrongSigner(signer);
        _useCheckedNonce(member, nonce);
        emit BonusPaid(member, amount, nonce);
        pool.depositFor{value: amount}(member);
    }
}
