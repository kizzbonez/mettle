contract SeatsTest is Test {
    function test_has_the_new_number_of_seats() public {
        LanternCruise cruise = new LanternCruise();
        assertEq(cruise.SEATS(), 40, "the SEATS constant");
        assertEq(cruise.seatsLeft(), 40, "seats left in a fresh contract");
        assertEq(cruise.sold(), 0, "places sold in a fresh contract");
    }
}
