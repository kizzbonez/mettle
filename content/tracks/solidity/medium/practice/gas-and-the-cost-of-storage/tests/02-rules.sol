contract TallyRulesTest is Test {
    ShearingTally tally;
    address ana = address(0xA11A);

    function setUp() public {
        tally = new ShearingTally();
    }

    function weights(uint32 a, uint32 b, uint32 c) internal pure returns (uint32[] memory w) {
        w = new uint32[](3);
        w[0] = a;
        w[1] = b;
        w[2] = c;
    }

    function test_refuses_an_empty_run() public {
        vm.expectRevert(ShearingTally.EmptyRun.selector);
        tally.logRun(ana, new uint32[](0));
    }

    function test_refuses_a_zero_weight_at_its_index() public {
        vm.expectRevert(abi.encodeWithSelector(ShearingTally.BadWeight.selector, 1));
        tally.logRun(ana, weights(3000, 0, 3000));
    }

    function test_refuses_a_weight_above_the_scales() public {
        vm.expectRevert(abi.encodeWithSelector(ShearingTally.BadWeight.selector, 2));
        tally.logRun(ana, weights(3000, 3000, 15_001));
    }

    function test_accepts_the_heaviest_weight() public {
        tally.logRun(ana, weights(15_000, 1, 15_000));
        assertEq(tally.todayGrams(), 30_001, "today's grams after a run at the limits");
    }

    function test_a_refused_run_records_nothing() public {
        vm.expectRevert(abi.encodeWithSelector(ShearingTally.BadWeight.selector, 2));
        tally.logRun(ana, weights(3000, 3000, 0));
        assertEq(tally.todayFleeces(), 0, "today's fleeces after a refused run");
        assertEq(tally.shornBy(ana), 0, "fleeces shorn after a refused run");
    }

    function test_only_the_boss_logs_and_closes() public {
        uint32[] memory run = weights(3000, 3000, 3000);
        vm.prank(ana);
        vm.expectRevert(abi.encodeWithSelector(ShearingTally.NotBoss.selector, ana));
        tally.logRun(ana, run);
        vm.prank(ana);
        vm.expectRevert(abi.encodeWithSelector(ShearingTally.NotBoss.selector, ana));
        tally.closeDay();
    }

    function test_totals_across_runs_and_days() public {
        address ben = address(0xBE11);
        tally.logRun(ana, weights(3000, 4000, 5000));
        tally.logRun(ben, weights(2000, 2000, 2000));
        tally.closeDay();
        tally.logRun(ana, weights(1000, 1000, 1000));
        assertEq(tally.day(), 2, "the day after one close");
        assertEq(tally.todayFleeces(), 3, "today's fleeces on day 2");
        assertEq(tally.todayGrams(), 3000, "today's grams on day 2");
        assertEq(tally.totalFleeces(), 6, "all-time fleeces after day 1");
        assertEq(tally.totalGrams(), 18_000, "all-time grams after day 1");
        assertEq(tally.shornBy(ana), 6, "ana's fleeces over two days");
        assertEq(tally.shornBy(ben), 3, "ben's fleeces");
        tally.closeDay();
        assertEq(tally.totalGrams(), 21_000, "all-time grams after day 2");
        assertEq(tally.todayGrams(), 0, "today's grams after closing day 2");
    }

    function testFuzz_today_grams_is_the_sum(uint16[8] memory raw) public {
        uint32[] memory run = new uint32[](8);
        uint256 sum;
        for (uint256 i = 0; i < 8; i++) {
            run[i] = uint32(bound(raw[i], 1, 15_000));
            sum += run[i];
        }
        tally.logRun(ana, run);
        assertEq(tally.todayGrams(), sum, "today's grams after a run of eight");
        assertEq(tally.todayFleeces(), 8, "today's fleeces after a run of eight");
    }
}
