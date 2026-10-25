contract StringFaultSensor is IAnemometer {
    function windSpeed() external pure returns (uint256) {
        revert("bearing seized");
    }
}

contract BubblingTest is Test {
    WindRelay relay;

    function setUp() public {
        relay = new WindRelay();
    }

    function test_reads_each_sensor() public {
        relay.install(18);
        relay.install(27);
        assertEq(relay.readingOf(0), 18, "the reading of the first sensor");
        assertEq(relay.readingOf(1), 27, "the reading of the second sensor");
    }

    function test_iced_error_bubbles_up() public {
        Anemometer sensor = relay.install(50);
        sensor.set(50, true);
        vm.expectRevert(Anemometer.Iced.selector);
        relay.readingOf(0);
    }

    function test_revert_string_bubbles_up() public {
        relay.connect(address(new StringFaultSensor()));
        vm.expectRevert(bytes("bearing seized"));
        relay.readingOf(0);
    }

    function test_unknown_index_panics() public {
        relay.install(10);
        vm.expectRevert(stdError.indexOOBError);
        relay.readingOf(1);
    }
}
