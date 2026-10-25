// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @notice Passengers' tips, shared equally among the ferry's crew, who each collect their own.
/// @dev Nothing loops over a list that can grow without limit, nothing pays several people in
/// one call, and every amount credited is an amount that actually arrived.
contract TipPool {
    using SafeERC20 for IERC20;

    /// @notice A ferry's crew is small; the cap keeps the split in tip() cheap forever.
    uint256 public constant MAX_CREW = 12;

    IERC20 public immutable token;
    address public immutable skipper;
    address[] public crew;
    mapping(address member => uint256) public owed;
    /// @notice Tokens received but not yet shared out: less than one per crew member.
    uint256 public leftover;

    event Tipped(address indexed passenger, uint256 received);
    event Claimed(address indexed member, uint256 amount);

    error NotSkipper(address caller);
    error CrewFull();
    error NoCrew();
    error NothingOwed();

    constructor(IERC20 token_) {
        token = token_;
        skipper = msg.sender;
    }

    function crewSize() external view returns (uint256) {
        return crew.length;
    }

    /// @notice Adds a member to the crew. Only the skipper may, and at most MAX_CREW.
    function addCrew(address member) external {
        if (msg.sender != skipper) revert NotSkipper(msg.sender);
        if (crew.length == MAX_CREW) revert CrewFull();
        crew.push(member);
    }

    /// @notice Tips `amount` tokens and shares what arrives equally among the crew.
    function tip(uint256 amount) external {
        uint256 n = crew.length;
        if (n == 0) revert NoCrew();
        // Measure what arrived: a token may keep a fee, and may return no bool at all.
        uint256 before = token.balanceOf(address(this));
        token.safeTransferFrom(msg.sender, address(this), amount);
        uint256 received = token.balanceOf(address(this)) - before;

        uint256 toShare = received + leftover;
        uint256 share = toShare / n;
        for (uint256 i = 0; i < n; i++) {
            owed[crew[i]] += share;
        }
        leftover = toShare - share * n;
        emit Tipped(msg.sender, received);
    }

    /// @notice Pays the caller what they are owed. Nobody else's account can make this fail.
    function claim() external {
        uint256 amount = owed[msg.sender];
        if (amount == 0) revert NothingOwed();
        owed[msg.sender] = 0;
        emit Claimed(msg.sender, amount);
        token.safeTransfer(msg.sender, amount);
    }
}
