contract MeasurementsTest is Test {
    event Measured(uint256 indexed saplingId, uint256 previousCm, uint256 newCm);

    SaplingRegister register;
    address ada = address(0xA11CE);

    function setUp() public {
        register = new SaplingRegister();
        vm.prank(ada);
        register.plant(4, "rowan");
    }

    function testFuzz_reports_previous_then_new_height(uint256 first, uint256 second) public {
        vm.expectEmit(address(register));
        emit Measured(1, 0, first);
        vm.prank(ada);
        register.recordHeight(1, first);

        vm.expectEmit(address(register));
        emit Measured(1, first, second);
        vm.prank(ada);
        register.recordHeight(1, second);

        (,,, uint256 height) = register.saplings(1);
        assertEq(height, second, "the stored height after two measurements");
    }

    function test_one_log_per_measurement() public {
        vm.recordLogs();
        vm.prank(ada);
        register.recordHeight(1, 25);
        Vm.Log[] memory entries = vm.getRecordedLogs();
        assertEq(entries.length, 1, "number of logs from one measurement");
        assertEq(entries[0].topics.length, 2, "topics of a Measured log");
    }

    function testFuzz_only_the_planter_measures(address stranger) public {
        vm.assume(stranger != ada);
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(SaplingRegister.NotPlanter.selector, 1, stranger));
        register.recordHeight(1, 99);
    }

    function test_unknown_saplings_are_refused() public {
        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(SaplingRegister.UnknownSapling.selector, 2));
        register.recordHeight(2, 10);

        vm.expectRevert(abi.encodeWithSelector(SaplingRegister.UnknownSapling.selector, 0));
        register.recordHeight(0, 10);
    }
}
