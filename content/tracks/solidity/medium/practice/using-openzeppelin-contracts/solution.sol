// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuardTransient} from "@openzeppelin/contracts/utils/ReentrancyGuardTransient.sol";

/// @notice The rowing club's dues box: members pay yearly dues in the club's token, the
/// treasurer moves the money on, and the stewards can pause payments during an incident.
contract DuesBox is AccessControl, Pausable, ReentrancyGuardTransient {
    using SafeERC20 for IERC20;

    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");
    bytes32 public constant STEWARD_ROLE = keccak256("STEWARD_ROLE");

    IERC20 public immutable token;
    uint256 public immutable yearlyDues;
    mapping(address member => uint256) public yearsPaid;

    event DuesPaid(address indexed member, uint256 numYears, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    error ZeroYears();

    /// @param admin holds DEFAULT_ADMIN_ROLE and appoints treasurers.
    /// @param treasurer holds TREASURER_ROLE, which is the admin role of STEWARD_ROLE.
    constructor(IERC20 token_, uint256 yearlyDues_, address admin, address treasurer) {
        token = token_;
        yearlyDues = yearlyDues_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(TREASURER_ROLE, treasurer);
        _setRoleAdmin(STEWARD_ROLE, TREASURER_ROLE);
    }

    /// @notice Pay `numYears` of dues; the box must be approved for the amount first.
    function payDues(uint256 numYears) external whenNotPaused nonReentrant {
        if (numYears == 0) revert ZeroYears();
        uint256 amount = numYears * yearlyDues;
        yearsPaid[msg.sender] += numYears;
        emit DuesPaid(msg.sender, numYears, amount);
        token.safeTransferFrom(msg.sender, address(this), amount);
    }

    /// @notice The treasurer moves dues on, also while payments are paused.
    function withdraw(address to, uint256 amount) external onlyRole(TREASURER_ROLE) nonReentrant {
        emit Withdrawn(to, amount);
        token.safeTransfer(to, amount);
    }

    function pause() external onlyRole(STEWARD_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(STEWARD_ROLE) {
        _unpause();
    }
}
