contract ExampleTest is Test {
    HillClimbTimes times;

    function setUp() public {
        times = new HillClimbTimes();
    }

    function test_example() public {
        uint256 first = times.pack(7, 3, 125_000);
        assertEq(first, 0x0000000703000000000001e848, "pack(7, 3, 125000)");
        assertEq(times.riderOf(first), 7, "riderOf the packed word");
        assertEq(times.gateOf(first), 3, "gateOf the packed word");
        assertEq(times.millisOf(first), 125_000, "millisOf the packed word");

        assertEq(times.highestGate(0x0b), 3, "highestGate of gates 0, 1 and 3");
        vm.expectRevert(HillClimbTimes.NoGates.selector);
        times.highestGate(0);

        uint256[] memory words = new uint256[](2);
        words[0] = first;
        words[1] = times.pack(9, 4, 131_500);
        assertEq(times.totalMillis(words), 256_500, "totalMillis of two results");
    }
}
