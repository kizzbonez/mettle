/// A copy of TelescopeLoans that counts a started day from the due second itself, so a
/// telescope returned exactly on time already pays a day.
contract ChargesOnTimeLoans {
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
    error NotBorrower(address caller);
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
        if (returnedAt < dueAt) return 0;
        uint256 daysLate = (returnedAt - dueAt) / 1 days + 1;
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

/// Runs your due-second test against the real contract and against the broken copy.
contract YourTestCatchesAnOnTimeFee is Test {
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

    function test_due_second_test_passes_on_the_real_contract() public {
        bytes memory call = abi.encodeCall(TelescopeLoansTest.test_return_at_the_due_second_is_free, ());
        assertTrue(
            _passes(_suite(""), call), "test_return_at_the_due_second_is_free against the real contract (must pass)"
        );
    }

    function test_due_second_test_catches_a_fee_charged_on_time() public {
        bytes memory broken = address(new ChargesOnTimeLoans(IMembers(makeAddr("members")))).code;
        bytes memory call = abi.encodeCall(TelescopeLoansTest.test_return_at_the_due_second_is_free, ());
        assertFalse(
            _passes(_suite(broken), call),
            "test_return_at_the_due_second_is_free against a copy that charges a day at the due second (must fail)"
        );
    }
}
