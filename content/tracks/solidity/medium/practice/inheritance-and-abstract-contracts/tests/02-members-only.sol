/// A layer of the test's own, to see whether MembersOnly passes the booking on.
abstract contract MembersHookCounter is BookingDesk {
    uint256 public hookRuns;

    function _checkBooking(address booker, uint256 slot) internal virtual override {
        hookRuns++;
        super._checkBooking(booker, slot);
    }
}

/// Free bookings, members only. Linearized: MembersOnlyProbe, MembersOnly, MembersHookCounter, BookingDesk.
contract MembersOnlyProbe is MembersHookCounter, MembersOnly {
    function fee() public pure override returns (uint256) {
        return 0;
    }

    function _checkBooking(address booker, uint256 slot) internal override(MembersHookCounter, MembersOnly) {
        super._checkBooking(booker, slot);
    }
}

contract MembersOnlyTest is Test {
    MembersOnlyProbe desk;
    address cy = makeAddr("cy");

    function setUp() public {
        desk = new MembersOnlyProbe();
    }

    function test_a_member_books() public {
        desk.setMember(cy, true);
        vm.prank(cy);
        desk.book(7);
        assertEq(desk.bookedBy(7), cy, "the booker of a member's slot");
    }

    function test_a_stranger_is_turned_away() public {
        vm.expectRevert(abi.encodeWithSelector(MembersOnly.NotMember.selector, cy));
        vm.prank(cy);
        desk.book(7);
        assertEq(desk.bookedBy(7), address(0), "a refused slot stays free");
    }

    function test_a_removed_member_is_turned_away() public {
        desk.setMember(cy, true);
        desk.setMember(cy, false);
        vm.expectRevert(abi.encodeWithSelector(MembersOnly.NotMember.selector, cy));
        vm.prank(cy);
        desk.book(7);
    }

    function test_passes_the_booking_on_with_super() public {
        desk.setMember(cy, true);
        vm.prank(cy);
        desk.book(1);
        assertEq(desk.hookRuns(), 1, "the next layer's hook ran after MembersOnly's rule");
    }
}
