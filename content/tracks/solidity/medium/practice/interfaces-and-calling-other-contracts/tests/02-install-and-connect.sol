contract MakerSensor is IAnemometer {
    function windSpeed() external pure returns (uint256) {
        return 33;
    }
}

contract InstallConnectTest is Test {
    event SensorAdded(address indexed sensor);

    WindRelay relay;

    function setUp() public {
        relay = new WindRelay();
    }

    function test_install_is_owned_by_the_caller() public {
        address warden = makeAddr("warden");
        vm.prank(warden);
        Anemometer sensor = relay.install(12);
        assertEq(sensor.owner(), warden, "the owner of a sensor installed by the warden");
        assertEq(relay.sensorCount(), 1, "sensors after one install");
        assertEq(address(relay.sensors(0)), address(sensor), "the stored sensor is the one returned");
        assertEq(sensor.windSpeed(), 12, "the starting reading of an installed sensor");

        vm.prank(warden);
        sensor.set(20, false);
        assertEq(relay.readingOf(0), 20, "the reading after the owner changed it");
    }

    function test_install_emits_the_new_address() public {
        address expected = vm.computeCreateAddress(address(relay), vm.getNonce(address(relay)));
        vm.expectEmit(address(relay));
        emit SensorAdded(expected);
        Anemometer sensor = relay.install(5);
        assertEq(address(sensor), expected, "the address install returned");
    }

    function test_connect_adds_another_makers_sensor() public {
        MakerSensor other = new MakerSensor();
        vm.expectEmit(address(relay));
        emit SensorAdded(address(other));
        relay.connect(address(other));
        assertEq(relay.sensorCount(), 1, "sensors after connecting one");
        assertEq(relay.readingOf(0), 33, "the reading of a connected sensor");
    }

    function test_connect_rejects_the_zero_address() public {
        vm.expectRevert(WindRelay.ZeroAddress.selector);
        relay.connect(address(0));
        assertEq(relay.sensorCount(), 0, "sensors after a refused connect");
    }

    function test_connect_rejects_an_address_without_code() public {
        address hiker = makeAddr("hiker");
        vm.expectRevert(abi.encodeWithSelector(WindRelay.NotAContract.selector, hiker));
        relay.connect(hiker);
        assertEq(relay.sensorCount(), 0, "sensors after a refused connect");
    }
}
