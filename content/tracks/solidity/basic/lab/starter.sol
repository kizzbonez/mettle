// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Orchestra instrument loans
contract InstrumentLibrary {
    struct Instrument {
        string name;
        uint256 deposit; // wei a borrower must leave
        address borrower; // the zero address while the instrument is on the shelf
    }

    address public immutable librarian;
    uint256 public instrumentCount;
    mapping(uint256 => Instrument) public instruments;
    mapping(address => bool) public isMember;

    /// @notice What each account may withdraw: returned deposits and change.
    mapping(address => uint256) public credit;
    /// @notice The sum of everyone's credit.
    uint256 public totalCredit;
    /// @notice Deposits of the instruments that are out on loan.
    uint256 public depositsHeld;
    /// @notice Damage fees kept and not yet withdrawn by the librarian.
    uint256 public fees;

    event InstrumentAdded(uint256 indexed id, string name, uint256 deposit);
    event MemberSet(address indexed account, bool allowed);
    event Borrowed(uint256 indexed id, address indexed borrower, uint256 deposit);
    event CheckedIn(uint256 indexed id, address indexed borrower, uint256 fee);
    event Withdrawn(address indexed account, uint256 amount);
    event FeesWithdrawn(address indexed to, uint256 amount);

    error NotLibrarian(address caller);
    error NotMember(address caller);
    error ZeroDeposit();
    error UnknownInstrument(uint256 id);
    error AlreadyOnLoan(uint256 id, address borrower);
    error NotOnLoan(uint256 id);
    error DepositTooLow(uint256 sent, uint256 required);
    error FeeTooHigh(uint256 fee, uint256 deposit);
    error NothingToWithdraw();
    error TransferFailed(address to, uint256 amount);

    constructor() {
        librarian = msg.sender;
    }

    modifier onlyLibrarian() {
        if (msg.sender != librarian) revert NotLibrarian(msg.sender);
        _;
    }

    // Task 1: write the onlyMember and knownInstrument(uint256 id) modifiers here.

    function setMember(address account, bool allowed) external onlyLibrarian {
        isMember[account] = allowed;
        emit MemberSet(account, allowed);
    }

    // Task 2
    function addInstrument(string calldata name, uint256 deposit) external returns (uint256 id) {
        revert("not implemented: addInstrument");
    }

    // Task 3
    function borrow(uint256 id) external payable {
        revert("not implemented: borrow");
    }

    // Task 4
    function checkIn(uint256 id, uint256 fee) external {
        revert("not implemented: checkIn");
    }

    // Task 5
    function withdraw() external {
        revert("not implemented: withdraw");
    }

    // Task 6
    function withdrawFees(address to) external {
        revert("not implemented: withdrawFees");
    }
}
