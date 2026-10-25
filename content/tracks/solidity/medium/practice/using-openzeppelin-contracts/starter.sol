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
    // Task 1: attach SafeERC20 to IERC20 here.

    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");
    bytes32 public constant STEWARD_ROLE = keccak256("STEWARD_ROLE");

    IERC20 public immutable token;
    uint256 public immutable yearlyDues;
    mapping(address member => uint256) public yearsPaid;

    event DuesPaid(address indexed member, uint256 numYears, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    error ZeroYears();

    constructor(IERC20 token_, uint256 yearlyDues_, address admin, address treasurer) {
        token = token_;
        yearlyDues = yearlyDues_;
        // Task 2: grant the two roles and make TREASURER_ROLE the admin of STEWARD_ROLE.
    }

    // Task 3: add the modifiers this function needs.
    function payDues(uint256 numYears) external {
        revert("not implemented: payDues");
    }

    // Task 4: add the modifiers this function needs.
    function withdraw(address to, uint256 amount) external {
        revert("not implemented: withdraw");
    }

    // Task 5
    function pause() external {
        revert("not implemented: pause");
    }

    // Task 5
    function unpause() external {
        revert("not implemented: unpause");
    }
}
