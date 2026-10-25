contract BorrowingTest is Test {
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

    function test_member_order_of_checks() public {
        // A stranger asking for an unknown instrument hears that they are not a member first.
        vm.deal(address(0xBAD), 1 ether);
        vm.prank(address(0xBAD));
        vm.expectRevert(abi.encodeWithSelector(InstrumentLibrary.NotMember.selector, address(0xBAD)));
        lib.borrow{value: 1 ether}(9);
    }

    function test_removed_members_cannot_borrow() public {
        lib.setMember(bo, false);
        vm.prank(bo);
        vm.expectRevert(abi.encodeWithSelector(InstrumentLibrary.NotMember.selector, bo));
        lib.borrow{value: 0.5 ether}(1);
    }

    function test_refuses_a_low_deposit() public {
        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(InstrumentLibrary.DepositTooLow.selector, 0.5 ether - 1, 0.5 ether));
        lib.borrow{value: 0.5 ether - 1}(1);
        (,, address borrower) = lib.instruments(1);
        assertEq(borrower, address(0), "borrower after a refused loan");
    }

    function test_one_borrower_at_a_time() public {
        vm.prank(ada);
        lib.borrow{value: 0.5 ether}(1);

        vm.prank(bo);
        vm.expectRevert(abi.encodeWithSelector(InstrumentLibrary.AlreadyOnLoan.selector, 1, ada));
        lib.borrow{value: 0.5 ether}(1);

        vm.prank(bo);
        lib.borrow{value: 0.2 ether}(2);
        (,, address flutist) = lib.instruments(2);
        assertEq(flutist, bo, "borrower of the flute");
        assertEq(lib.depositsHeld(), 0.7 ether, "deposits held with both instruments out");
        assertEq(lib.totalCredit(), 0, "credit after paying exact deposits");
        _checkBooks();
    }

    function test_already_on_loan_is_checked_before_the_payment() public {
        vm.prank(ada);
        lib.borrow{value: 0.5 ether}(1);
        vm.prank(bo);
        vm.expectRevert(abi.encodeWithSelector(InstrumentLibrary.AlreadyOnLoan.selector, 1, ada));
        lib.borrow{value: 0}(1);
    }

    function testFuzz_overpayment_becomes_credit(uint256 deposit, uint256 extra) public {
        deposit = bound(deposit, 1, 2 ether);
        extra = bound(extra, 0, 1 ether);
        uint256 id = lib.addInstrument("viola", deposit);

        vm.prank(ada);
        lib.borrow{value: deposit + extra}(id);

        assertEq(lib.credit(ada), extra, "credit after overpaying");
        assertEq(lib.totalCredit(), extra, "total credit after overpaying");
        assertEq(lib.depositsHeld(), deposit, "deposits held");
        assertEq(ada.balance, 5 ether - deposit - extra, "ether the borrower paid");
        _checkBooks();
    }
}
