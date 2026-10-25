contract TallyExampleTest is Test {
    event Fleece(uint256 indexed day, address indexed shearer, uint256 grams);
    event DayClosed(uint256 indexed day, uint256 fleeces, uint256 grams);

    function test_example() public {
        ShearingTally tally = new ShearingTally();
        address ana = address(0xA11A);

        uint32[] memory run = new uint32[](3);
        run[0] = 3200;
        run[1] = 4100;
        run[2] = 2900;
        vm.expectEmit(address(tally));
        emit Fleece(1, ana, 3200);
        tally.logRun(ana, run);
        assertEq(tally.todayFleeces(), 3, "today's fleeces after the run");
        assertEq(tally.todayGrams(), 10_200, "today's grams after the run");
        assertEq(tally.shornBy(ana), 3, "fleeces shorn by ana");

        vm.expectEmit(address(tally));
        emit DayClosed(1, 3, 10_200);
        tally.closeDay();
        assertEq(tally.day(), 2, "the day after closing day 1");
        assertEq(tally.todayFleeces(), 0, "today's fleeces after closing the day");
        assertEq(tally.totalGrams(), 10_200, "all-time grams after closing the day");
    }

    function test_budget_for_a_run_of_forty() public {
        ShearingTally tally = new ShearingTally();
        uint32[] memory run = new uint32[](40);
        for (uint256 i = 0; i < 40; i++) {
            run[i] = uint32(2_000 + ((i * 7919 + 1) % 6_000));
        }
        tally.logRun(address(0xA11A), run);
        uint256 used = vm.lastFrameGas().gasTotalUsed;
        console.log("gas for the first run of 40 fleeces:", used);
        assertLe(used, 210_000, "gas for the first run of 40 fleeces");
    }
}
