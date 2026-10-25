// A member's contract wallet that refuses every payment.
contract SealedCase {
    function borrow(InstrumentLibrary lib, uint256 id) external payable {
        lib.borrow{value: msg.value}(id);
    }
}

contract CheckInAndFeesTest is Test {
    event CheckedIn(uint256 indexed id, address indexed borrower, uint256 fee);

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
        vm.prank(ada);
        lib.borrow{value: 0.5 ether}(1);
    }

    function _checkBooks() internal view {
        assertEq(
            address(lib).balance,
            lib.depositsHeld() + lib.totalCredit() + lib.fees(),
            "balance equals depositsHeld + totalCredit + fees"
        );
    }

    function test_check_in_puts_the_instrument_back() public {
        vm.expectEmit(address(lib));
        emit CheckedIn(1, ada, 0);
        lib.checkIn(1, 0);

        (,, address borrower) = lib.instruments(1);
        assertEq(borrower, address(0), "borrower after the check-in");
        assertEq(lib.credit(ada), 0.5 ether, "credit after a check-in without a fee");
        assertEq(lib.depositsHeld(), 0, "deposits held after the check-in");

        vm.prank(bo);
        lib.borrow{value: 0.5 ether}(1);
        (,, borrower) = lib.instruments(1);
        assertEq(borrower, bo, "the next borrower of a checked-in instrument");
        _checkBooks();
    }

    function testFuzz_only_the_librarian_checks_in(address stranger) public {
        vm.assume(stranger != address(this));
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(InstrumentLibrary.NotLibrarian.selector, stranger));
        lib.checkIn(1, 0);
    }

    function test_the_borrower_cannot_check_in_their_own_loan() public {
        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(InstrumentLibrary.NotLibrarian.selector, ada));
        lib.checkIn(1, 0);
    }

    function test_refuses_an_instrument_on_the_shelf() public {
        vm.expectRevert(abi.encodeWithSelector(InstrumentLibrary.NotOnLoan.selector, 2));
        lib.checkIn(2, 0);

        lib.checkIn(1, 0);
        vm.expectRevert(abi.encodeWithSelector(InstrumentLibrary.NotOnLoan.selector, 1));
        lib.checkIn(1, 0);
    }

    function test_fee_limits() public {
        vm.expectRevert(abi.encodeWithSelector(InstrumentLibrary.FeeTooHigh.selector, 0.5 ether + 1, 0.5 ether));
        lib.checkIn(1, 0.5 ether + 1);

        lib.checkIn(1, 0.5 ether);
        assertEq(lib.credit(ada), 0, "credit when the whole deposit is kept");
        assertEq(lib.fees(), 0.5 ether, "fees when the whole deposit is kept");
        _checkBooks();
    }

    function testFuzz_fee_and_credit_add_up_to_the_deposit(uint256 fee, uint256 secondFee) public {
        fee = bound(fee, 0, 0.5 ether);
        secondFee = bound(secondFee, 0, 0.2 ether);
        vm.prank(bo);
        lib.borrow{value: 0.2 ether}(2);

        lib.checkIn(1, fee);
        lib.checkIn(2, secondFee);

        assertEq(lib.credit(ada), 0.5 ether - fee, "first borrower's credit");
        assertEq(lib.credit(bo), 0.2 ether - secondFee, "second borrower's credit");
        assertEq(lib.fees(), fee + secondFee, "fees from two check-ins");
        assertEq(lib.depositsHeld(), 0, "deposits held after both check-ins");
        _checkBooks();
    }

    function test_a_borrower_that_refuses_ether_cannot_block_a_check_in() public {
        SealedCase sealedCase = new SealedCase();
        lib.setMember(address(sealedCase), true);
        sealedCase.borrow{value: 0.2 ether}(lib, 2);

        lib.checkIn(2, 0.01 ether);
        (,, address borrower) = lib.instruments(2);
        assertEq(borrower, address(0), "the instrument is back on the shelf");
        assertEq(lib.credit(address(sealedCase)), 0.19 ether, "credit kept for the refusing borrower");
        _checkBooks();
    }
}
