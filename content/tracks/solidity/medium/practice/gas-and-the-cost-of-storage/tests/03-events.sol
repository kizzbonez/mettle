contract TallyEventsTest is Test {
    event Fleece(uint256 indexed day, address indexed shearer, uint256 grams);
    event DayClosed(uint256 indexed day, uint256 fleeces, uint256 grams);

    ShearingTally tally;
    address ana = address(0xA11A);

    function setUp() public {
        tally = new ShearingTally();
    }

    function test_one_event_per_fleece_in_order() public {
        uint32[] memory run = new uint32[](4);
        run[0] = 2500;
        run[1] = 3600;
        run[2] = 4700;
        run[3] = 5800;
        vm.recordLogs();
        tally.logRun(ana, run);
        Vm.Log[] memory logs = vm.getRecordedLogs();
        assertEq(logs.length, 4, "events emitted by a run of four");
        for (uint256 i = 0; i < 4; i++) {
            assertEq(logs[i].topics[0], Fleece.selector, "the kind of each event");
            assertEq(logs[i].topics[1], bytes32(uint256(1)), "the day in each Fleece event");
            assertEq(logs[i].topics[2], bytes32(uint256(uint160(ana))), "the shearer in each Fleece event");
            assertEq(abi.decode(logs[i].data, (uint256)), run[i], "the grams in each Fleece event");
        }
    }

    function test_fleece_events_carry_the_new_day() public {
        uint32[] memory run = new uint32[](1);
        run[0] = 3000;
        tally.logRun(ana, run);
        tally.closeDay();
        vm.expectEmit(address(tally));
        emit Fleece(2, ana, 3000);
        tally.logRun(ana, run);
    }

    function test_day_closed_reports_the_day() public {
        uint32[] memory run = new uint32[](2);
        run[0] = 3000;
        run[1] = 3500;
        tally.logRun(ana, run);
        tally.logRun(address(0xBE11), run);
        vm.expectEmit(address(tally));
        emit DayClosed(1, 4, 13_000);
        tally.closeDay();
        vm.expectEmit(address(tally));
        emit DayClosed(2, 0, 0);
        tally.closeDay();
    }
}
