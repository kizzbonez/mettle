contract ExampleTest is Test {
    event NightBooked(uint256 indexed night, address indexed observer);
    event DirectorshipOffered(address indexed director, address indexed candidate);
    event DirectorChanged(address indexed previousDirector, address indexed newDirector);

    function test_example() public {
        address ada = address(0xA11CE);
        address bea = address(0xBEA);
        TelescopeRota rota = new TelescopeRota();
        rota.setObserver(ada, true);

        vm.expectEmit(address(rota));
        emit NightBooked(5, ada);
        vm.prank(ada);
        rota.bookNight(5);
        assertEq(rota.observerOn(5), ada, "the observer booked on night 5");

        vm.expectEmit(address(rota));
        emit DirectorshipOffered(address(this), bea);
        rota.offerDirectorship(bea);
        assertEq(rota.director(), address(this), "the director before the offer is accepted");

        vm.expectEmit(address(rota));
        emit DirectorChanged(address(this), bea);
        vm.prank(bea);
        rota.acceptDirectorship();
        assertEq(rota.director(), bea, "the director after accepting");
        assertEq(rota.candidate(), address(0), "the candidate after accepting");

        vm.expectRevert(abi.encodeWithSelector(TelescopeRota.NotDirector.selector, address(this)));
        rota.pause();
    }
}
