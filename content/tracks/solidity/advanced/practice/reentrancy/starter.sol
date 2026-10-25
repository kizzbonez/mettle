// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title The beekeepers' co-op vault
/// @notice Members deposit ether for the shared extractor fund, move deposits to each other,
/// withdraw them, and claim one member badge (an ERC-721) once they have deposited enough.
/// @dev Two functions hand control to the caller before their state is up to date. Fix them.
contract CoopVault is ERC721 {
    uint256 public constant BADGE_MIN = 0.1 ether;

    mapping(address => uint256) public depositOf;
    mapping(address => bool) public hasBadge;
    uint256 public nextBadgeId = 1;

    event Deposited(address indexed member, uint256 amount);
    event DepositMoved(address indexed from, address indexed to, uint256 amount);
    event Withdrawn(address indexed member, uint256 amount);
    event BadgeClaimed(address indexed member, uint256 indexed badgeId);

    error InsufficientDeposit(uint256 available, uint256 needed);
    error NothingToWithdraw();
    error PaymentFailed();
    error DepositTooSmall(uint256 available, uint256 needed);
    error AlreadyClaimed();

    constructor() ERC721("Beekeepers Co-op Badge", "BEE") {}

    function deposit() external payable {
        depositOf[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    /// @notice Moves `amount` of the caller's deposit to `to`.
    function transferDeposit(address to, uint256 amount) external {
        uint256 available = depositOf[msg.sender];
        if (amount > available) revert InsufficientDeposit(available, amount);
        depositOf[msg.sender] = available - amount;
        depositOf[to] += amount;
        emit DepositMoved(msg.sender, to, amount);
    }

    /// @notice Pays the caller their whole deposit.
    function withdrawAll() external {
        uint256 amount = depositOf[msg.sender];
        if (amount == 0) revert NothingToWithdraw();
        emit Withdrawn(msg.sender, amount);
        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert PaymentFailed();
        depositOf[msg.sender] = 0;
    }

    /// @notice Mints the caller's member badge, once, if they hold at least `BADGE_MIN`.
    function claimBadge() external {
        uint256 available = depositOf[msg.sender];
        if (available < BADGE_MIN) revert DepositTooSmall(available, BADGE_MIN);
        if (hasBadge[msg.sender]) revert AlreadyClaimed();
        uint256 badgeId = nextBadgeId++;
        emit BadgeClaimed(msg.sender, badgeId);
        _safeMint(msg.sender, badgeId);
        hasBadge[msg.sender] = true;
    }
}
