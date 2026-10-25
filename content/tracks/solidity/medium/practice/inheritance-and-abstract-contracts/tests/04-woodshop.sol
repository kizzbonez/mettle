contract WoodshopTest is Test {
    event Booked(address indexed booker, uint256 indexed slot);

    Woodshop shop;
    address fay = makeAddr("fay");
    address gus = makeAddr("gus");

    function setUp() public {
        shop = new Woodshop(2);
        shop.setMember(fay, true);
        vm.deal(fay, 1 ether);
        vm.deal(gus, 1 ether);
    }

    /// The test contract owns the woodshop, so withdrawn fees come here.
    receive() external payable {}

    function test_the_fee_through_the_base_type() public {
        BookingDesk desk = shop;
        assertEq(desk.fee(), 0.01 ether, "the fee asked through the BookingDesk type");
    }

    function test_a_wrong_fee_is_refused() public {
        vm.expectRevert(abi.encodeWithSelector(BookingDesk.WrongFee.selector, 0.02 ether, 0.01 ether));
        vm.prank(fay);
        shop.book{value: 0.02 ether}(4);
    }

    function test_a_member_books_and_pays() public {
        vm.expectEmit(address(shop));
        emit Booked(fay, 4);
        vm.prank(fay);
        shop.book{value: 0.01 ether}(4);
        assertEq(shop.bookedBy(4), fay, "the booker of slot 4");
        assertEq(shop.slotsOf(fay), 1, "fay's slots after one booking");
        assertEq(address(shop).balance, 0.01 ether, "the fees held by the woodshop");

        shop.withdraw();
        assertEq(address(shop).balance, 0, "the fees left after the owner withdrew");
    }

    function test_strangers_cannot_book_or_be_counted() public {
        vm.expectRevert(abi.encodeWithSelector(MembersOnly.NotMember.selector, gus));
        vm.prank(gus);
        shop.book{value: 0.01 ether}(5);
        assertEq(shop.slotsOf(gus), 0, "a refused stranger's slot count");
        assertEq(shop.bookedBy(5), address(0), "a slot refused to a stranger stays free");
    }

    function test_members_are_limited() public {
        vm.startPrank(fay);
        shop.book{value: 0.01 ether}(1);
        shop.book{value: 0.01 ether}(2);
        vm.expectRevert(abi.encodeWithSelector(SlotLimit.LimitReached.selector, fay, 2));
        shop.book{value: 0.01 ether}(3);
        vm.stopPrank();
    }

    function test_the_limit_rule_runs_first() public {
        vm.startPrank(fay);
        shop.book{value: 0.01 ether}(1);
        shop.book{value: 0.01 ether}(2);
        vm.stopPrank();
        shop.setMember(fay, false);
        vm.expectRevert(abi.encodeWithSelector(SlotLimit.LimitReached.selector, fay, 2));
        vm.prank(fay);
        shop.book{value: 0.01 ether}(3);
    }

    function test_a_taken_slot_is_refused() public {
        shop.setMember(gus, true);
        vm.prank(fay);
        shop.book{value: 0.01 ether}(9);
        vm.expectRevert(abi.encodeWithSelector(BookingDesk.SlotTaken.selector, 9));
        vm.prank(gus);
        shop.book{value: 0.01 ether}(9);
    }
}
