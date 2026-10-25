/// A layer of the test's own, to see whether SlotLimit passes the booking on.
abstract contract LimitHookCounter is BookingDesk {
    uint256 public hookRuns;

    function _checkBooking(address booker, uint256 slot) internal virtual override {
        hookRuns++;
        super._checkBooking(booker, slot);
    }
}

/// Free bookings, a limit per booker. Linearized: SlotLimitProbe, SlotLimit, LimitHookCounter, BookingDesk.
contract SlotLimitProbe is LimitHookCounter, SlotLimit {
    constructor(uint256 maxSlots_) SlotLimit(maxSlots_) {}

    function fee() public pure override returns (uint256) {
        return 0;
    }

    function _checkBooking(address booker, uint256 slot) internal override(LimitHookCounter, SlotLimit) {
        super._checkBooking(booker, slot);
    }
}

contract SlotLimitTest is Test {
    address dee = makeAddr("dee");
    address eli = makeAddr("eli");

    function test_counts_each_booking() public {
        SlotLimitProbe desk = new SlotLimitProbe(3);
        vm.startPrank(dee);
        desk.book(10);
        desk.book(11);
        vm.stopPrank();
        assertEq(desk.slotsOf(dee), 2, "dee's slots after two bookings");
        assertEq(desk.slotsOf(eli), 0, "eli's slots when only dee booked");
    }

    function test_refuses_the_booking_over_the_limit() public {
        SlotLimitProbe desk = new SlotLimitProbe(1);
        vm.prank(dee);
        desk.book(10);
        vm.expectRevert(abi.encodeWithSelector(SlotLimit.LimitReached.selector, dee, 1));
        vm.prank(dee);
        desk.book(11);
        assertEq(desk.slotsOf(dee), 1, "dee's slots after a refused booking");

        vm.prank(eli);
        desk.book(11);
        assertEq(desk.bookedBy(11), eli, "another booker still gets the slot");
    }

    function test_a_limit_of_zero_refuses_everyone() public {
        SlotLimitProbe desk = new SlotLimitProbe(0);
        vm.expectRevert(abi.encodeWithSelector(SlotLimit.LimitReached.selector, eli, 0));
        vm.prank(eli);
        desk.book(1);
    }

    function test_passes_the_booking_on_with_super() public {
        SlotLimitProbe desk = new SlotLimitProbe(2);
        vm.startPrank(dee);
        desk.book(1);
        desk.book(2);
        vm.stopPrank();
        assertEq(desk.hookRuns(), 2, "the next layer's hook ran after SlotLimit's rule");
    }

    function testFuzz_exactly_the_limit_fits(uint8 limit) public {
        uint256 maxSlots = bound(limit, 1, 12);
        SlotLimitProbe desk = new SlotLimitProbe(maxSlots);
        vm.startPrank(dee);
        for (uint256 slot = 0; slot < maxSlots; slot++) {
            desk.book(slot);
        }
        assertEq(desk.slotsOf(dee), maxSlots, "dee's slots after booking up to the limit");
        vm.expectRevert(abi.encodeWithSelector(SlotLimit.LimitReached.selector, dee, maxSlots));
        desk.book(maxSlots);
        vm.stopPrank();
    }
}
