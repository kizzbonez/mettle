contract LastSeatTest is Test {
    LanternCruise cruise;

    function setUp() public {
        cruise = new LanternCruise();
    }

    function test_sells_every_seat() public {
        cruise.book(25);
        cruise.book(15);
        assertEq(cruise.sold(), 40, "places sold after two bookings that fill the boat");
        assertEq(cruise.seatsLeft(), 0, "seats left on a full boat");
    }

    function test_refuses_a_seat_on_a_full_boat() public {
        cruise.book(40);
        vm.expectRevert(abi.encodeWithSelector(LanternCruise.NotEnoughSeats.selector, 1, 0));
        cruise.book(1);
    }
}
