// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @notice Passengers' tips, shared equally among the ferry's crew, who each collect their own.
contract TipPool {
    using SafeERC20 for IERC20;

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

    // Task 1: cap the crew at MAX_CREW.
    function addCrew(address member) external {
        if (msg.sender != skipper) revert NotSkipper(msg.sender);
        crew.push(member);
    }

    // Task 2: rewrite tip() (see instructions.md).
    function tip(uint256 amount) external {
        require(token.transferFrom(msg.sender, address(this), amount), "transfer failed");
        uint256 share = amount / crew.length;
        for (uint256 i = 0; i < crew.length; i++) {
            owed[crew[i]] += share;
        }
        emit Tipped(msg.sender, amount);
    }

    // Task 3: write claim(). It replaces the old payOut(), which paid the whole crew at once
    // and stopped working for everyone the day the token froze one member's address:
    //
    //     function payOut() external {
    //         for (uint256 i = 0; i < crew.length; i++) {
    //             uint256 amount = owed[crew[i]];
    //             owed[crew[i]] = 0;
    //             require(token.transfer(crew[i], amount), "transfer failed");
    //         }
    //     }
    function claim() external {
        revert("not implemented: claim");
    }
}
