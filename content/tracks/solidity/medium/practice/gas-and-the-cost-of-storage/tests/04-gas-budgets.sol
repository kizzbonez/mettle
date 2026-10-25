contract TallyGasBudgetsTest is Test {
    ShearingTally tally;

    function setUp() public {
        tally = new ShearingTally();
    }

    function forty(uint256 seed) internal pure returns (uint32[] memory run) {
        run = new uint32[](40);
        for (uint256 i = 0; i < 40; i++) {
            run[i] = uint32(2_000 + ((i * 7919 + seed) % 6_000));
        }
    }

    function test_first_run_of_forty() public {
        tally.logRun(address(0xA11A), forty(1));
        assertLe(vm.lastFrameGas().gasTotalUsed, 210_000, "gas for the first run of 40 fleeces");
    }

    function test_second_run_of_forty_by_the_same_shearer() public {
        tally.logRun(address(0xA11A), forty(1));
        tally.logRun(address(0xA11A), forty(2));
        assertLe(vm.lastFrameGas().gasTotalUsed, 156_000, "gas for a second run of 40 by the same shearer");
    }

    function test_closing_a_day() public {
        tally.logRun(address(0xA11A), forty(1));
        tally.logRun(address(0xBE11), forty(2));
        tally.closeDay();
        Vm.Gas memory g = vm.lastFrameGas();
        assertLe(g.gasTotalUsed, 90_000, "gas for closing a day");
        assertGe(g.gasRefunded, 9_600, "the refund for clearing today's two counters");
    }
}
