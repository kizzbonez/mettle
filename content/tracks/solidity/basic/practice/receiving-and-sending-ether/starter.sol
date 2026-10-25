// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SavingsJar {
    /// @notice The ether each member has saved and not yet withdrawn, in wei.
    mapping(address => uint256) public savedBy;
    /// @notice The sum of everyone's savings.
    uint256 public totalSaved;

    event Saved(address indexed member, uint256 amount);
    event Withdrawn(address indexed member, uint256 amount);

    error ZeroAmount();
    error InsufficientSavings(uint256 saved, uint256 requested);
    error TransferFailed(address to, uint256 amount);
    error UnknownCall();

    // Task 1
    function save() public payable {
        revert("not implemented: save");
    }

    // Task 2
    receive() external payable {
        revert("not implemented: receive");
    }

    // Task 3
    fallback() external payable {
        revert("not implemented: fallback");
    }

    // Task 4
    function withdraw(uint256 amount) external {
        revert("not implemented: withdraw");
    }
}
