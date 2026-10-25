// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Orchestra instrument loans
/// @notice Members borrow the orchestra's instruments by leaving a deposit in ether. When an
/// instrument comes back, the librarian keeps a fee for any damage and the rest of the deposit
/// is credited to the member, who withdraws it with everything else they are owed.
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

    modifier onlyMember() {
        if (!isMember[msg.sender]) revert NotMember(msg.sender);
        _;
    }

    modifier knownInstrument(uint256 id) {
        if (id == 0 || id > instrumentCount) revert UnknownInstrument(id);
        _;
    }

    /// @notice Give or take away an account's right to borrow.
    function setMember(address account, bool allowed) external onlyLibrarian {
        isMember[account] = allowed;
        emit MemberSet(account, allowed);
    }

    /// @notice Put a new instrument on the shelf.
    /// @param name What it is, such as "cello".
    /// @param deposit The wei a borrower must leave; never zero.
    /// @return id The new instrument's id; ids start at 1.
    function addInstrument(string calldata name, uint256 deposit) external onlyLibrarian returns (uint256 id) {
        if (deposit == 0) revert ZeroDeposit();
        id = ++instrumentCount;
        instruments[id] = Instrument({name: name, deposit: deposit, borrower: address(0)});
        emit InstrumentAdded(id, name, deposit);
    }

    /// @notice Borrow an instrument that is on the shelf, leaving its deposit.
    /// @dev Anything paid above the deposit is credited to the borrower. No ether leaves here.
    function borrow(uint256 id) external payable onlyMember knownInstrument(id) {
        Instrument storage instrument = instruments[id];
        if (instrument.borrower != address(0)) revert AlreadyOnLoan(id, instrument.borrower);
        uint256 deposit = instrument.deposit;
        if (msg.value < deposit) revert DepositTooLow(msg.value, deposit);

        instrument.borrower = msg.sender;
        depositsHeld += deposit;
        _credit(msg.sender, msg.value - deposit);
        emit Borrowed(id, msg.sender, deposit);
    }

    /// @notice Take an instrument back, keeping `fee` wei of its deposit for damage.
    /// @dev The rest of the deposit is credited, not sent: a borrower that cannot receive
    /// ether cannot stop the check-in.
    function checkIn(uint256 id, uint256 fee) external onlyLibrarian knownInstrument(id) {
        Instrument storage instrument = instruments[id];
        address borrower = instrument.borrower;
        if (borrower == address(0)) revert NotOnLoan(id);
        uint256 deposit = instrument.deposit;
        if (fee > deposit) revert FeeTooHigh(fee, deposit);

        instrument.borrower = address(0);
        depositsHeld -= deposit;
        fees += fee;
        _credit(borrower, deposit - fee);
        emit CheckedIn(id, borrower, fee);
    }

    /// @notice Withdraw everything you are owed.
    function withdraw() external {
        uint256 amount = credit[msg.sender];
        if (amount == 0) revert NothingToWithdraw();
        credit[msg.sender] = 0;
        totalCredit -= amount;
        _pay(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    /// @notice Send the damage fees collected so far to `to`.
    function withdrawFees(address to) external onlyLibrarian {
        uint256 amount = fees;
        if (amount == 0) revert NothingToWithdraw();
        fees = 0;
        _pay(to, amount);
        emit FeesWithdrawn(to, amount);
    }

    function _credit(address account, uint256 amount) private {
        credit[account] += amount;
        totalCredit += amount;
    }

    function _pay(address to, uint256 amount) private {
        (bool ok,) = to.call{value: amount}("");
        if (!ok) revert TransferFailed(to, amount);
    }
}
