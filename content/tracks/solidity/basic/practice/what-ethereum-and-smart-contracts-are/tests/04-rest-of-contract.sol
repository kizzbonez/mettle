contract RestOfContractTest is Test {
    function test_keeps_the_name() public {
        LanternCruise cruise = new LanternCruise();
        assertEq(cruise.BOAT(), "Kingfisher", "the boat's name");
    }

    function test_refuses_more_than_the_boat_holds() public {
        LanternCruise cruise = new LanternCruise();
        vm.expectRevert(abi.encodeWithSelector(LanternCruise.NotEnoughSeats.selector, 41, 40));
        cruise.book(41);
        assertEq(cruise.sold(), 0, "places sold after a refused booking");
    }
}
