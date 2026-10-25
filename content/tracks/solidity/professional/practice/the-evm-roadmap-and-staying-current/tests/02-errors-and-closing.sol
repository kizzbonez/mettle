contract LockerErrorsTest is Test {
    LockerDeposits box;
    address clubOwner = makeAddr("clubOwner");
    address ann = makeAddr("ann");

    function setUp() public {
        vm.prank(clubOwner);
        box = new LockerDeposits();
        vm.deal(ann, 10 ether);
    }

    function test_an_empty_deposit_is_refused() public {
        vm.prank(ann);
        vm.expectRevert(LockerDeposits.NothingSent.selector);
        box.deposit{value: 0}();
    }

    function testFuzz_withdrawals_up_to_the_deposit(uint96 put, uint96 take) public {
        put = uint96(bound(put, 1, 10 ether));
        vm.prank(ann);
        box.deposit{value: put}();
        vm.prank(ann);
        if (take > put) {
            vm.expectRevert(abi.encodeWithSelector(LockerDeposits.InsufficientDeposit.selector, put, take));
            box.withdraw(take);
            assertEq(box.deposits(ann), put, "the deposit after a refused withdrawal");
        } else {
            box.withdraw(take);
            assertEq(box.deposits(ann), put - take, "the deposit after a withdrawal");
            assertEq(ann.balance, 10 ether - put + take, "Ann's balance after a withdrawal");
        }
    }

    function test_only_the_owner_closes() public {
        vm.prank(ann);
        vm.expectRevert(abi.encodeWithSelector(LockerDeposits.NotOwner.selector, ann));
        box.close();
        assertFalse(box.closed(), "closed after a refused close");
    }

    function test_closing_pays_the_club_and_stops_deposits() public {
        vm.prank(ann);
        box.deposit{value: 2 ether}();
        vm.prank(clubOwner);
        box.close();
        assertTrue(box.closed(), "closed after the owner closed the box");
        assertEq(clubOwner.balance, 2 ether, "what the club received when the box was closed");
        assertEq(address(box).balance, 0, "the box's balance after closing");
        assertGt(address(box).code.length, 0, "the box still has code after closing (EIP-6780)");

        vm.prank(ann);
        vm.expectRevert(LockerDeposits.Closed.selector);
        box.deposit{value: 1 ether}();
        assertEq(address(box).balance, 0, "the box's balance after a refused late deposit");
    }
}
