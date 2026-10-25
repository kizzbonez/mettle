contract GuardsTest is Test {
    TelescopeRota rota;
    address ada = address(0xA11CE);

    function setUp() public {
        rota = new TelescopeRota();
        rota.setObserver(ada, true);
    }

    function testFuzz_strangers_cannot_run_the_rota(address stranger) public {
        vm.assume(stranger != address(this));
        bytes memory refused = abi.encodeWithSelector(TelescopeRota.NotDirector.selector, stranger);

        vm.prank(stranger);
        vm.expectRevert(refused);
        rota.setObserver(stranger, true);

        vm.prank(stranger);
        vm.expectRevert(refused);
        rota.pause();

        vm.prank(stranger);
        vm.expectRevert(refused);
        rota.unpause();

        vm.prank(stranger);
        vm.expectRevert(refused);
        rota.offerDirectorship(stranger);

        assertFalse(rota.paused(), "paused after a stranger tried to pause");
        assertEq(rota.candidate(), address(0), "candidate after a stranger tried to offer");
    }

    function testFuzz_only_observers_book(address stranger) public {
        vm.assume(stranger != ada);
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(TelescopeRota.NotObserver.selector, stranger));
        rota.bookNight(9);
    }

    function test_removed_observer_cannot_book() public {
        rota.setObserver(ada, false);
        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(TelescopeRota.NotObserver.selector, ada));
        rota.bookNight(9);
    }

    function test_the_role_belongs_to_the_direct_caller() public {
        // vm.prank(sender, origin) sets msg.sender and tx.origin. Here Ada signed the
        // transaction, but another contract is the one calling the rota: it must be refused.
        vm.prank(address(0xC0DE), ada);
        vm.expectRevert(abi.encodeWithSelector(TelescopeRota.NotObserver.selector, address(0xC0DE)));
        rota.bookNight(3);

        vm.prank(ada, address(0xC0DE));
        rota.bookNight(3);
        assertEq(rota.observerOn(3), ada, "the observer booked on night 3");
    }

    function test_a_night_is_booked_once() public {
        rota.setObserver(address(0xB0B), true);
        vm.prank(ada);
        rota.bookNight(5);
        vm.prank(address(0xB0B));
        vm.expectRevert(abi.encodeWithSelector(TelescopeRota.NightTaken.selector, 5, ada));
        rota.bookNight(5);
    }
}
