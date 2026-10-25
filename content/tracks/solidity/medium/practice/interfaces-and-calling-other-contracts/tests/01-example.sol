contract RelayExampleTest is Test {
    function test_example() public {
        WindRelay relay = new WindRelay();
        Anemometer a = relay.install(40);
        Anemometer b = relay.install(65);
        assertEq(a.owner(), address(this), "the owner of an installed sensor");

        (uint256 top, uint256 working) = relay.strongestGust();
        assertEq(top, 65, "the strongest gust with two working sensors");
        assertEq(working, 2, "the working count with two working sensors");

        b.set(65, true);
        vm.expectRevert(Anemometer.Iced.selector);
        relay.readingOf(1);

        (top, working) = relay.strongestGust();
        assertEq(top, 40, "the strongest gust with one sensor iced up");
        assertEq(working, 1, "the working count with one sensor iced up");

        vm.expectRevert(abi.encodeWithSelector(WindRelay.NotAContract.selector, address(0xBEEF)));
        relay.connect(address(0xBEEF));
    }
}
