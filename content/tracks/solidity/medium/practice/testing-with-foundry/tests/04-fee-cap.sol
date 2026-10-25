/// A copy of TelescopeLoans whose late fee is never capped: after 20 days it is more than the
/// deposit, and giving the telescope back fails.
contract UncappedFeeLoans {
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
        if (returnedAt <= dueAt) return 0;
        uint256 daysLate = (returnedAt - dueAt + 1 days - 1) / 1 days;
        return daysLate * FEE_PER_DAY;
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

/// Runs your fuzz test against the real contract at the edges of its range, and against the
/// broken copy with a telescope that comes back 40 days late.
contract YourFuzzTestCatchesAnUncappedFee is Test {
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

    function _fuzzCall(uint256 lateBy) internal pure returns (bytes memory) {
        return abi.encodeCall(TelescopeLoansTest.testFuzz_refund_and_fee_add_up_to_the_deposit, (lateBy));
    }

    function test_fuzz_test_passes_on_time() public {
        assertTrue(_passes(_suite(""), _fuzzCall(0)), "the fuzz test with a return on time (must pass)");
    }

    function test_fuzz_test_passes_one_second_late() public {
        assertTrue(_passes(_suite(""), _fuzzCall(1)), "the fuzz test with a return one second late (must pass)");
    }

    function test_fuzz_test_passes_sixty_days_late() public {
        assertTrue(_passes(_suite(""), _fuzzCall(60 days)), "the fuzz test with a return 60 days late (must pass)");
    }

    function test_fuzz_test_catches_an_uncapped_fee() public {
        bytes memory broken = address(new UncappedFeeLoans(IMembers(makeAddr("members")))).code;
        assertFalse(
            _passes(_suite(broken), _fuzzCall(40 days)),
            "testFuzz_refund_and_fee_add_up_to_the_deposit against a copy whose late fee has no cap (must fail)"
        );
    }
}
