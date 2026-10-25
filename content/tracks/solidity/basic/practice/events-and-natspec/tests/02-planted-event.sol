contract PlantedEventTest is Test {
    event Planted(uint256 indexed saplingId, uint256 indexed plot, address indexed planter, string species);

    SaplingRegister register;

    function setUp() public {
        register = new SaplingRegister();
    }

    function test_planted_log_has_three_indexed_topics() public {
        vm.recordLogs();
        vm.prank(address(0xB0B));
        register.plant(12, "hawthorn");
        Vm.Log[] memory entries = vm.getRecordedLogs();

        assertEq(entries.length, 1, "number of logs from one planting");
        assertEq(entries[0].emitter, address(register), "the contract that emitted the log");
        assertEq(entries[0].topics.length, 4, "topics of a Planted log (signature and indexed parameters)");
        assertEq(
            entries[0].topics[0],
            keccak256("Planted(uint256,uint256,address,string)"),
            "topic 0 of the log (the event's name and parameter types)"
        );
        assertEq(uint256(entries[0].topics[1]), 1, "the sapling id in topic 1");
        assertEq(uint256(entries[0].topics[2]), 12, "the plot in topic 2");
        assertEq(address(uint160(uint256(entries[0].topics[3]))), address(0xB0B), "the planter in topic 3");
        assertEq(abi.decode(entries[0].data, (string)), "hawthorn", "the species read from the log's data");
    }

    function test_ids_count_up_from_one() public {
        register.plant(1, "hazel");
        register.plant(1, "blackthorn");

        vm.expectEmit(address(register));
        emit Planted(3, 2, address(this), "field maple");
        uint256 id = register.plant(2, "field maple");

        assertEq(id, 3, "the id returned for the third sapling");
        assertEq(register.saplingCount(), 3, "saplingCount after three plantings");
    }

    function testFuzz_planted_names_the_caller_and_plot(address planter, uint256 plot) public {
        vm.expectEmit(address(register));
        emit Planted(1, plot, planter, "dog rose");
        vm.prank(planter);
        register.plant(plot, "dog rose");
    }
}
