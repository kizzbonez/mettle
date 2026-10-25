contract ReasonSensor is IAnemometer {
    function windSpeed() external pure returns (uint256) {
        revert("vane missing");
    }
}

contract PanicSensor is IAnemometer {
    uint256 private calibration;

    function windSpeed() external view returns (uint256) {
        return 100 / calibration; // division by zero: a panic
    }
}

contract SilentSensor is IAnemometer {
    function windSpeed() external pure returns (uint256) {
        revert();
    }
}

contract FixedSensor is IAnemometer {
    uint256 private immutable speed;

    constructor(uint256 speed_) {
        speed = speed_;
    }

    function windSpeed() external view returns (uint256) {
        return speed;
    }
}

contract StrongestGustTest is Test {
    WindRelay relay;

    function setUp() public {
        relay = new WindRelay();
    }

    function test_no_sensors_means_no_readings() public {
        vm.expectRevert(WindRelay.NoReadings.selector);
        relay.strongestGust();
    }

    function test_skips_every_kind_of_failure() public {
        Anemometer iced = relay.install(140);
        iced.set(140, true);
        relay.connect(address(new ReasonSensor()));
        relay.connect(address(new PanicSensor()));
        relay.connect(address(new SilentSensor()));
        relay.connect(address(new FixedSensor(72)));
        relay.install(31);

        (uint256 top, uint256 working) = relay.strongestGust();
        assertEq(top, 72, "the strongest gust among the working sensors");
        assertEq(working, 2, "the number of sensors that answered");
    }

    function test_all_failing_means_no_readings() public {
        relay.connect(address(new ReasonSensor()));
        relay.connect(address(new SilentSensor()));
        Anemometer iced = relay.install(9);
        iced.set(9, true);
        vm.expectRevert(WindRelay.NoReadings.selector);
        relay.strongestGust();
    }

    function test_a_calm_night_still_counts() public {
        relay.install(0);
        (uint256 top, uint256 working) = relay.strongestGust();
        assertEq(top, 0, "the strongest gust when the only sensor reads zero");
        assertEq(working, 1, "a sensor reading zero still answered");
    }

    function testFuzz_finds_the_highest_reading(uint256 a, uint256 b, uint256 c) public {
        relay.install(a);
        relay.connect(address(new FixedSensor(b)));
        relay.install(c);
        uint256 highest = a > b ? (a > c ? a : c) : (b > c ? b : c);
        (uint256 top, uint256 working) = relay.strongestGust();
        assertEq(top, highest, "the strongest gust of three readings");
        assertEq(working, 3, "the working count of three healthy sensors");
    }
}
