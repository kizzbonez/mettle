// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice The climbing wall's locker deposit box. Members leave a deposit for their locker key
/// and take it back at the end of the season.
/// @dev Modernised for today's EVM: custom errors, no "no contracts" check (smart accounts and
/// EIP-7702 accounts are members too), payments with call, a transient reentrancy lock, and a
/// close() that does not rely on selfdestruct (EIP-6780 no longer removes the contract).
contract LockerDeposits {
    address public owner;
    bool private transient locked;
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

    /// @dev The lock lives in transient storage: cheap, and cleared at the end of the
    /// transaction anyway. It is still reset here, so that a batch can make several calls.
    modifier noReentry() {
        if (locked) revert Reentrant();
        locked = true;
        _;
        locked = false;
    }

    /// @notice Leaves `msg.value` as the caller's deposit. Any account may deposit.
    function deposit() external payable {
        if (closed) revert Closed();
        if (msg.value == 0) revert NothingSent();
        deposits[msg.sender] += msg.value;
    }

    /// @notice Returns `amount` wei of the caller's deposit.
    function withdraw(uint256 amount) external noReentry {
        uint256 available = deposits[msg.sender];
        if (available < amount) revert InsufficientDeposit(available, amount);
        deposits[msg.sender] = available - amount;
        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert PaymentFailed();
    }

    /// @notice Ends the season: no more deposits, and what is left goes to the club.
    function close() external {
        if (msg.sender != owner) revert NotOwner(msg.sender);
        closed = true;
        (bool ok,) = owner.call{value: address(this).balance}("");
        if (!ok) revert PaymentFailed();
    }
}
