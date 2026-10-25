// A section's shared contract wallet that counts the payments it receives: a storage write,
// which needs more than the 2300 gas that transfer and send pass on.
contract SectionWallet {
    uint256 public paymentsReceived;

    function borrow(InstrumentLibrary lib, uint256 id) external payable {
        lib.borrow{value: msg.value}(id);
    }

    function cashOut(InstrumentLibrary lib) external {
        lib.withdraw();
    }

    receive() external payable {
        paymentsReceived += 1;
    }
}

// A wallet that refuses every payment.
contract LockedCase {
    function borrow(InstrumentLibrary lib, uint256 id) external payable {
        lib.borrow{value: msg.value}(id);
    }

    function cashOut(InstrumentLibrary lib) external {
        lib.withdraw();
    }
}

// A member that tries to withdraw a second time from inside the first payment.
contract DoubleDipper {
    InstrumentLibrary public lib;
    uint256 public timesPaid;

    constructor(InstrumentLibrary lib_) {
        lib = lib_;
    }

    function borrow(uint256 id) external payable {
        lib.borrow{value: msg.value}(id);
    }

    function cashOut() external {
        lib.withdraw();
    }

    receive() external payable {
        timesPaid += 1;
        if (timesPaid == 1) {
            // Ignore the outcome: if the second withdrawal is refused, the first payment lands.
            (bool ok,) = address(lib).call(abi.encodeCall(InstrumentLibrary.withdraw, ()));
            ok;
        }
    }
}

contract WithdrawalsTest is Test {
    InstrumentLibrary lib;
    address ada = address(0xA11CE);
    address bo = address(0xB0);

    function setUp() public {
        lib = new InstrumentLibrary();
        lib.addInstrument("cello", 0.5 ether);
        lib.addInstrument("flute", 0.2 ether);
        lib.setMember(ada, true);
        lib.setMember(bo, true);
        vm.deal(ada, 5 ether);
        vm.deal(bo, 5 ether);
    }

    function _checkBooks() internal view {
        assertEq(
            address(lib).balance,
            lib.depositsHeld() + lib.totalCredit() + lib.fees(),
            "balance equals depositsHeld + totalCredit + fees"
        );
    }

    function test_withdraw_pays_everything_once() public {
        vm.prank(ada);
        lib.borrow{value: 0.7 ether}(1);
        lib.checkIn(1, 0.1 ether);

        vm.prank(ada);
        lib.withdraw();
        assertEq(ada.balance, 4.9 ether, "the member's ether after withdrawing");
        assertEq(lib.credit(ada), 0, "credit after withdrawing");
        assertEq(lib.totalCredit(), 0, "total credit after withdrawing");
        _checkBooks();

        vm.prank(ada);
        vm.expectRevert(InstrumentLibrary.NothingToWithdraw.selector);
        lib.withdraw();
    }

    function test_nothing_to_withdraw() public {
        vm.prank(bo);
        vm.expectRevert(InstrumentLibrary.NothingToWithdraw.selector);
        lib.withdraw();

        vm.expectRevert(InstrumentLibrary.NothingToWithdraw.selector);
        lib.withdrawFees(address(this));
    }

    function test_fees_go_where_the_librarian_says_and_only_once() public {
        vm.prank(ada);
        lib.borrow{value: 0.5 ether}(1);
        lib.checkIn(1, 0.2 ether);

        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(InstrumentLibrary.NotLibrarian.selector, ada));
        lib.withdrawFees(ada);

        lib.withdrawFees(address(0xF00D));
        assertEq(address(0xF00D).balance, 0.2 ether, "fees received");
        assertEq(lib.fees(), 0, "fees after the withdrawal");
        assertEq(lib.credit(ada), 0.3 ether, "the member's credit is untouched");
        _checkBooks();
    }

    function test_pays_a_wallet_whose_receive_writes_storage() public {
        SectionWallet wallet = new SectionWallet();
        lib.setMember(address(wallet), true);
        wallet.borrow{value: 0.5 ether}(lib, 1);
        lib.checkIn(1, 0);

        wallet.cashOut(lib);
        assertEq(address(wallet).balance, 0.5 ether, "ether received by the wallet");
        assertEq(wallet.paymentsReceived(), 1, "payments the wallet counted");
    }

    function test_a_failed_payment_keeps_the_credit() public {
        LockedCase lockedCase = new LockedCase();
        lib.setMember(address(lockedCase), true);
        lockedCase.borrow{value: 0.2 ether}(lib, 2);
        lib.checkIn(2, 0);

        vm.expectRevert(abi.encodeWithSelector(InstrumentLibrary.TransferFailed.selector, address(lockedCase), 0.2 ether));
        lockedCase.cashOut(lib);
        assertEq(lib.credit(address(lockedCase)), 0.2 ether, "credit after a failed payment");
        _checkBooks();
    }

    function test_a_member_calling_back_is_paid_once() public {
        vm.prank(bo);
        lib.borrow{value: 0.5 ether}(1);
        lib.checkIn(1, 0);

        DoubleDipper dipper = new DoubleDipper(lib);
        lib.setMember(address(dipper), true);
        dipper.borrow{value: 0.2 ether}(2);
        lib.checkIn(2, 0);

        dipper.cashOut();
        assertEq(address(dipper).balance, 0.2 ether, "ether the calling-back member received");
        assertEq(address(lib).balance, 0.5 ether, "ether kept for the other member");
        _checkBooks();

        vm.prank(bo);
        lib.withdraw();
        assertEq(bo.balance, 5 ether, "the other member's ether after withdrawing");
    }

    function testFuzz_books_balance_through_a_whole_evening(uint256 extra, uint256 fee, uint256 secondFee) public {
        extra = bound(extra, 0, 1 ether);
        fee = bound(fee, 0, 0.5 ether);
        secondFee = bound(secondFee, 0, 0.2 ether);

        vm.prank(ada);
        lib.borrow{value: 0.5 ether + extra}(1);
        _checkBooks();
        vm.prank(bo);
        lib.borrow{value: 0.2 ether}(2);
        _checkBooks();
        lib.checkIn(1, fee);
        _checkBooks();

        if (lib.credit(ada) > 0) {
            vm.prank(ada);
            lib.withdraw();
        }
        _checkBooks();
        lib.checkIn(2, secondFee);
        if (fee + secondFee > 0) lib.withdrawFees(address(0xF00D));
        _checkBooks();
        if (secondFee < 0.2 ether) {
            vm.prank(bo);
            lib.withdraw();
        }

        assertEq(ada.balance, 5 ether - fee, "the first member paid only the fee");
        assertEq(bo.balance, 5 ether - secondFee, "the second member paid only the fee");
        assertEq(address(0xF00D).balance, fee + secondFee, "the fees collected");
        assertEq(address(lib).balance, 0, "ether left once everyone is paid");
    }
}
