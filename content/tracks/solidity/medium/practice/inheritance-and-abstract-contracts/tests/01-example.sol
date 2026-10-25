contract WoodshopExampleTest is Test {
    event Booked(address indexed booker, uint256 indexed slot);

    function test_example() public {
        address ada = makeAddr("ada");
        address bo = makeAddr("bo");
        vm.deal(ada, 1 ether);
        vm.deal(bo, 1 ether);

        Woodshop shop = new Woodshop(2);
        shop.setMember(ada, true);

        vm.expectEmit(address(shop));
        emit Booked(ada, 1);
        vm.prank(ada);
        shop.book{value: 0.01 ether}(1);

        vm.prank(ada);
        shop.book{value: 0.01 ether}(2);
        assertEq(shop.slotsOf(ada), 2, "ada's slots after two bookings");

        vm.expectRevert(abi.encodeWithSelector(SlotLimit.LimitReached.selector, ada, 2));
        vm.prank(ada);
        shop.book{value: 0.01 ether}(3);

        vm.expectRevert(abi.encodeWithSelector(MembersOnly.NotMember.selector, bo));
        vm.prank(bo);
        shop.book{value: 0.01 ether}(3);

        shop.setMember(ada, false);
        vm.expectRevert(abi.encodeWithSelector(SlotLimit.LimitReached.selector, ada, 2));
        vm.prank(ada);
        shop.book{value: 0.01 ether}(3);
    }
}
