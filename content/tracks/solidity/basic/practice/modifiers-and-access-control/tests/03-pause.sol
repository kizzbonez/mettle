contract PauseTest is Test {
    event Paused(address by);
    event Unpaused(address by);

    TelescopeRota rota;
    address ada = address(0xA11CE);

    function setUp() public {
        rota = new TelescopeRota();
        rota.setObserver(ada, true);
    }

    function test_pause_stops_bookings_until_unpaused() public {
        vm.expectEmit(address(rota));
        emit Paused(address(this));
        rota.pause();
        assertTrue(rota.paused(), "paused after pause()");

        vm.prank(ada);
        vm.expectRevert(TelescopeRota.RotaPaused.selector);
        rota.bookNight(1);

        vm.expectEmit(address(rota));
        emit Unpaused(address(this));
        rota.unpause();

        vm.prank(ada);
        rota.bookNight(1);
        assertEq(rota.observerOn(1), ada, "the booking made after unpausing");
    }

    function test_non_observer_hears_NotObserver_first() public {
        rota.pause();
        vm.prank(address(0xBAD));
        vm.expectRevert(abi.encodeWithSelector(TelescopeRota.NotObserver.selector, address(0xBAD)));
        rota.bookNight(1);
    }

    function test_director_still_manages_observers_while_paused() public {
        rota.pause();
        rota.setObserver(address(0xB0B), true);
        assertTrue(rota.isObserver(address(0xB0B)), "observer added while paused");
    }
}
