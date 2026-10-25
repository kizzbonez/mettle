/// A copy of TelescopeLoans whose giveBack forgets to check the borrower: anyone can give a
/// telescope back and walk away with its deposit.
contract AnyoneGivesBackLoans {
    uint256 public constant DEPOSIT = 0.2 ether;
    uint256 public constant LOAN_PERIOD = 7 days;
    uint256 public constant FEE_PER_DAY = 0.01 ether;

    struct Loan {
        address borrower;
        uint64 dueAt;
    }

    IMembers public immutable members;
    mapping(uint256 scope => Loan) public loans;
    uint256 public feesCollected;

    event Borrowed(uint256 indexed scope, address indexed borrower, uint256 dueAt);
    event Returned(uint256 indexed scope, address indexed borrower, uint256 fee);

    error NotMember(address who);
    error WrongDeposit(uint256 sent);
    error OnLoan(uint256 scope);
    error NotOnLoan(uint256 scope);
    error RefundFailed();

    constructor(IMembers members_) {
        members = members_;
    }

    function borrow(uint256 scope) external payable {
        if (!members.isMember(msg.sender)) revert NotMember(msg.sender);
        if (msg.value != DEPOSIT) revert WrongDeposit(msg.value);
        if (loans[scope].borrower != address(0)) revert OnLoan(scope);
        uint256 dueAt = block.timestamp + LOAN_PERIOD;
        loans[scope] = Loan(msg.sender, uint64(dueAt));
        emit Borrowed(scope, msg.sender, dueAt);
    }

    function lateFee(uint256 dueAt, uint256 returnedAt) public pure returns (uint256) {
        if (returnedAt <= dueAt) return 0;
        uint256 daysLate = (returnedAt - dueAt + 1 days - 1) / 1 days;
        uint256 fee = daysLate * FEE_PER_DAY;
        return fee < DEPOSIT ? fee : DEPOSIT;
    }

    function giveBack(uint256 scope) external {
        Loan memory loan = loans[scope];
        if (loan.borrower == address(0)) revert NotOnLoan(scope);
        uint256 fee = lateFee(loan.dueAt, block.timestamp);
        delete loans[scope];
        feesCollected += fee;
        emit Returned(scope, msg.sender, fee);
        (bool ok,) = msg.sender.call{value: DEPOSIT - fee}("");
        if (!ok) revert RefundFailed();
    }
}

/// A copy of TelescopeLoans whose borrow never asks the membership list.
contract AnyoneBorrowsLoans {
    uint256 public constant DEPOSIT = 0.2 ether;
    uint256 public constant LOAN_PERIOD = 7 days;
    uint256 public constant FEE_PER_DAY = 0.01 ether;

    struct Loan {
        address borrower;
        uint64 dueAt;
    }

    IMembers public immutable members;
    mapping(uint256 scope => Loan) public loans;
    uint256 public feesCollected;

    event Borrowed(uint256 indexed scope, address indexed borrower, uint256 dueAt);
    event Returned(uint256 indexed scope, address indexed borrower, uint256 fee);

    error WrongDeposit(uint256 sent);
    error OnLoan(uint256 scope);
    error NotOnLoan(uint256 scope);
    error NotBorrower(address caller);
    error RefundFailed();

    constructor(IMembers members_) {
        members = members_;
    }

    function borrow(uint256 scope) external payable {
        if (msg.value != DEPOSIT) revert WrongDeposit(msg.value);
        if (loans[scope].borrower != address(0)) revert OnLoan(scope);
        uint256 dueAt = block.timestamp + LOAN_PERIOD;
        loans[scope] = Loan(msg.sender, uint64(dueAt));
        emit Borrowed(scope, msg.sender, dueAt);
    }

    function lateFee(uint256 dueAt, uint256 returnedAt) public pure returns (uint256) {
        if (returnedAt <= dueAt) return 0;
        uint256 daysLate = (returnedAt - dueAt + 1 days - 1) / 1 days;
        uint256 fee = daysLate * FEE_PER_DAY;
        return fee < DEPOSIT ? fee : DEPOSIT;
    }

    function giveBack(uint256 scope) external {
        Loan memory loan = loans[scope];
        if (loan.borrower == address(0)) revert NotOnLoan(scope);
        if (msg.sender != loan.borrower) revert NotBorrower(msg.sender);
        uint256 fee = lateFee(loan.dueAt, block.timestamp);
        delete loans[scope];
        feesCollected += fee;
        emit Returned(scope, msg.sender, fee);
        (bool ok,) = msg.sender.call{value: DEPOSIT - fee}("");
        if (!ok) revert RefundFailed();
    }
}

/// Runs your access tests against the real contract and against the two broken copies.
contract YourTestsCatchAccessBugs is Test {
    /// A fresh suite whose rental runs `brokenCode` instead of the real contract, if given.
    function _suite(bytes memory brokenCode) internal returns (TelescopeLoansTest suite) {
        vm.warp(1_000_000);
        suite = new TelescopeLoansTest();
        suite.setUp();
        if (brokenCode.length > 0) vm.etch(address(suite.rental()), brokenCode);
    }

    function _passes(TelescopeLoansTest suite, bytes memory call) internal returns (bool ok) {
        (ok,) = address(suite).call(call);
    }

    function test_stranger_test_passes_on_the_real_contract() public {
        bytes memory call = abi.encodeCall(TelescopeLoansTest.test_stranger_cannot_give_back, ());
        assertTrue(_passes(_suite(""), call), "test_stranger_cannot_give_back against the real contract (must pass)");
    }

    function test_stranger_test_catches_an_unchecked_give_back() public {
        bytes memory broken = address(new AnyoneGivesBackLoans(IMembers(makeAddr("members")))).code;
        bytes memory call = abi.encodeCall(TelescopeLoansTest.test_stranger_cannot_give_back, ());
        assertFalse(
            _passes(_suite(broken), call),
            "test_stranger_cannot_give_back against a copy where anyone can give a telescope back (must fail)"
        );
    }

    function test_non_member_test_passes_on_the_real_contract() public {
        bytes memory call = abi.encodeCall(TelescopeLoansTest.test_non_member_cannot_borrow, ());
        assertTrue(_passes(_suite(""), call), "test_non_member_cannot_borrow against the real contract (must pass)");
    }

    function test_non_member_test_catches_an_unchecked_borrow() public {
        bytes memory broken = address(new AnyoneBorrowsLoans(IMembers(makeAddr("members")))).code;
        bytes memory call = abi.encodeCall(TelescopeLoansTest.test_non_member_cannot_borrow, ());
        assertFalse(
            _passes(_suite(broken), call),
            "test_non_member_cannot_borrow against a copy that lends to non-members (must fail)"
        );
    }
}
