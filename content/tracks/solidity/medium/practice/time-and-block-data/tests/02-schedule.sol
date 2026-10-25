contract BonusScheduleTest is Test {
    uint256 constant START = 1_767_225_600;
    address cal = address(0xCA1);

    function make(uint256 cliff, uint256 duration, uint256 amount) internal returns (ApprenticeBonus) {
        vm.deal(address(this), amount);
        return new ApprenticeBonus{value: amount}(cal, START, cliff, duration);
    }

    function test_nothing_before_the_start() public {
        ApprenticeBonus bonus = make(0, 30 days, 3 ether);
        assertEq(bonus.vestedAt(START - 1), 0, "vested one second before the start, with no cliff");
        assertEq(bonus.vestedAt(0), 0, "vested at time zero");
        assertEq(bonus.vestedAt(START), 0, "vested at the start, with no cliff");
    }

    function test_the_cliff_and_the_end() public {
        ApprenticeBonus bonus = make(10 days, 40 days, 4 ether);
        assertEq(bonus.vestedAt(START + 10 days - 1), 0, "vested one second before the cliff");
        assertEq(bonus.vestedAt(START + 10 days), 1 ether, "vested exactly at the cliff");
        assertEq(bonus.vestedAt(START + 40 days - 1 days), 3.9 ether, "vested one day before the end");
        assertEq(bonus.vestedAt(START + 40 days), 4 ether, "vested exactly at the end");
        assertEq(bonus.vestedAt(START + 4000 days), 4 ether, "vested long after the end");
    }

    function test_multiplies_before_dividing() public {
        ApprenticeBonus bonus = make(0, 3 days, 1_000_000_007);
        assertEq(bonus.vestedAt(START + 1 days), 333_333_335, "vested after a third of an odd amount");
        assertEq(bonus.vestedAt(START + 1), 3858, "vested after one second");
    }

    function test_a_cliff_as_long_as_the_schedule() public {
        ApprenticeBonus bonus = make(20 days, 20 days, 2 ether);
        assertEq(bonus.vestedAt(START + 20 days - 1), 0, "vested just before an all-at-once cliff");
        assertEq(bonus.vestedAt(START + 20 days), 2 ether, "vested at an all-at-once cliff");
    }

    function testFuzz_grows_and_never_exceeds_the_total(uint32 a, uint32 b) public {
        ApprenticeBonus bonus = make(30 days, 365 days, 12 ether);
        (uint256 early, uint256 late) = a < b ? (uint256(a), uint256(b)) : (uint256(b), uint256(a));
        uint256 first = bonus.vestedAt(START + early);
        uint256 second = bonus.vestedAt(START + late);
        assertLe(first, second, "vested never shrinks as time goes on");
        assertLe(second, 12 ether, "vested never exceeds the total");
        if (late >= 30 days && late < 365 days) {
            assertEq(second, 12 ether * late / 365 days, "vested between the cliff and the end");
        }
    }

    function test_refuses_a_bad_schedule() public {
        vm.deal(address(this), 10 ether);
        vm.expectRevert(ApprenticeBonus.BadSchedule.selector);
        new ApprenticeBonus{value: 1 ether}(address(0), START, 0, 10 days);
        vm.expectRevert(ApprenticeBonus.BadSchedule.selector);
        new ApprenticeBonus(cal, START, 0, 10 days);
        vm.expectRevert(ApprenticeBonus.BadSchedule.selector);
        new ApprenticeBonus{value: 1 ether}(cal, START, 0, 0);
        vm.expectRevert(ApprenticeBonus.BadSchedule.selector);
        new ApprenticeBonus{value: 1 ether}(cal, START, 11 days, 10 days);
    }
}
