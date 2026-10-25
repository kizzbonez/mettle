contract RehearsalEveningTest is Test {
    event InstrumentAdded(uint256 indexed id, string name, uint256 deposit);
    event Borrowed(uint256 indexed id, address indexed borrower, uint256 deposit);
    event CheckedIn(uint256 indexed id, address indexed borrower, uint256 fee);
    event Withdrawn(address indexed account, uint256 amount);
    event FeesWithdrawn(address indexed to, uint256 amount);

    InstrumentLibrary lib;
    address ada = address(0xA11CE);

    function _checkBooks(string memory step) internal view {
        assertEq(
            address(lib).balance,
            lib.depositsHeld() + lib.totalCredit() + lib.fees(),
            string.concat("balance equals depositsHeld + totalCredit + fees, ", step)
        );
    }

    function test_rehearsal_evening() public {
        lib = new InstrumentLibrary();
        vm.deal(ada, 1 ether);

        vm.expectEmit(address(lib));
        emit InstrumentAdded(1, "cello", 0.5 ether);
        assertEq(lib.addInstrument("cello", 0.5 ether), 1, "id of the first instrument");
        assertEq(lib.addInstrument("flute", 0.2 ether), 2, "id of the second instrument");
        lib.setMember(ada, true);

        vm.expectEmit(address(lib));
        emit Borrowed(1, ada, 0.5 ether);
        vm.prank(ada);
        lib.borrow{value: 0.6 ether}(1);
        assertEq(lib.credit(ada), 0.1 ether, "Ada's credit after overpaying the cello's deposit");
        assertEq(lib.depositsHeld(), 0.5 ether, "deposits held with the cello out");
        _checkBooks("after borrowing the cello");

        vm.prank(ada);
        lib.borrow{value: 0.2 ether}(2);
        assertEq(lib.depositsHeld(), 0.7 ether, "deposits held with both instruments out");
        (,, address flutist) = lib.instruments(2);
        assertEq(flutist, ada, "borrower of the flute");

        vm.expectEmit(address(lib));
        emit CheckedIn(1, ada, 0.05 ether);
        lib.checkIn(1, 0.05 ether);
        assertEq(lib.credit(ada), 0.55 ether, "Ada's credit after the cello's check-in");
        assertEq(lib.fees(), 0.05 ether, "fees after the check-in");
        assertEq(lib.depositsHeld(), 0.2 ether, "deposits held with only the flute out");
        _checkBooks("after the check-in");

        vm.expectEmit(address(lib));
        emit Withdrawn(ada, 0.55 ether);
        vm.prank(ada);
        lib.withdraw();
        assertEq(ada.balance, 0.75 ether, "Ada's ether after withdrawing");

        vm.expectEmit(address(lib));
        emit FeesWithdrawn(address(0xF00D), 0.05 ether);
        lib.withdrawFees(address(0xF00D));
        assertEq(address(0xF00D).balance, 0.05 ether, "fees received");
        assertEq(address(lib).balance, 0.2 ether, "ether held for the flute");
        _checkBooks("after both withdrawals");

        vm.deal(address(0xB0B), 1 ether);
        vm.prank(address(0xB0B));
        vm.expectRevert(abi.encodeWithSelector(InstrumentLibrary.NotMember.selector, address(0xB0B)));
        lib.borrow{value: 0.5 ether}(1);

        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(InstrumentLibrary.AlreadyOnLoan.selector, 2, ada));
        lib.borrow{value: 0.2 ether}(2);
    }
}
