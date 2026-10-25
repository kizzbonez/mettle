// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Regatta savings jar
/// @notice Members save ether here and withdraw their own savings whenever they like.
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

    /// @notice Add the ether sent with this call to your savings.
    function save() public payable {
        if (msg.value == 0) revert ZeroAmount();
        savedBy[msg.sender] += msg.value;
        totalSaved += msg.value;
        emit Saved(msg.sender, msg.value);
    }

    /// @notice A plain transfer to the jar counts as saving.
    receive() external payable {
        save();
    }

    /// @dev Calls to functions the jar does not have are refused with a clear error, and any
    /// ether sent with them goes back with the revert.
    fallback() external payable {
        revert UnknownCall();
    }

    /// @notice Take `amount` wei of your savings out of the jar.
    /// @dev Checks, then updates the records, then pays: a recipient that calls back in finds
    /// the savings already reduced.
    function withdraw(uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        uint256 saved = savedBy[msg.sender];
        if (amount > saved) revert InsufficientSavings(saved, amount);

        savedBy[msg.sender] = saved - amount;
        totalSaved -= amount;

        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }
}
