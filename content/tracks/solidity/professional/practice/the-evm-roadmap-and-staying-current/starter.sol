// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice The climbing wall's locker deposit box, written in 2021. Members leave a deposit
/// for their locker key and take it back at the end of the season.
/// @dev Modernise it: see instructions.md. The errors below are the ones the new version uses.
contract LockerDeposits {
    address public owner;
    uint256 private locked = 1;
    bool public closed;
    mapping(address => uint256) public deposits;

    error NotOwner(address caller);
    error NothingSent();
    error InsufficientDeposit(uint256 available, uint256 needed);
    error Reentrant();
    error PaymentFailed();
    error Closed();

    constructor() {
        owner = msg.sender;
    }

    modifier noReentry() {
        require(locked == 1, "reentrant call");
        locked = 2;
        _;
        locked = 1;
    }

    function deposit() external payable {
        require(msg.sender.code.length == 0, "people only, no contracts");
        require(msg.value > 0, "nothing sent");
        deposits[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) external noReentry {
        require(deposits[msg.sender] >= amount, "deposit too small");
        deposits[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
    }

    /// @notice Ends the season: the box is removed and what is left goes to the club.
    function close() external {
        require(msg.sender == owner, "not owner");
        selfdestruct(payable(owner));
    }
}
