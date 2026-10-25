contract BasketsCloseDayTest is Test {
    BerryBaskets day;

    function setUp() public {
        day = new BerryBaskets();
    }

    function testFuzz_only_the_farmer_closes_the_day(address stranger) public {
        vm.assume(stranger != address(this));
        day.reserve(2);

        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(BerryBaskets.NotFarmer.selector, stranger));
        day.closeDay();

        assertEq(day.reserved(), 2, "baskets reserved after a stranger tried to close the day");
        assertEq(day.owed(), 0.019 ether, "wei owed after a stranger tried to close the day");
    }

    function test_the_deployer_is_the_farmer() public {
        vm.prank(address(0xFA12));
        BerryBaskets other = new BerryBaskets();
        assertEq(other.farmer(), address(0xFA12), "the farmer of a contract deployed by another address");

        vm.expectRevert(abi.encodeWithSelector(BerryBaskets.NotFarmer.selector, address(this)));
        other.closeDay();

        vm.prank(address(0xFA12));
        assertEq(other.closeDay(), 0, "the takings of a day without orders");
    }

    function test_closing_returns_the_takings_and_starts_afresh() public {
        vm.prank(address(0xA11CE));
        day.reserve(8);
        vm.prank(address(0xB0B));
        day.reserve(2);

        assertEq(day.closeDay(), 0.077951 ether, "the takings of a day with two orders");
        assertEq(day.reserved(), 0, "baskets reserved after closing the day");
        assertEq(day.owed(), 0, "wei owed after closing the day");
        assertEq(day.closeDay(), 0, "the takings when the day is closed twice");

        for (uint256 i = 0; i < 7; i++) {
            day.reserve(8);
        }
        day.reserve(4);
        assertEq(day.reserved(), 60, "baskets reserved on the next day, up to the full limit");
    }
}
