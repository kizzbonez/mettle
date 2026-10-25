contract HighestGateTest is Test {
    HillClimbTimes times;

    function setUp() public {
        times = new HillClimbTimes();
    }

    function referenceHighest(uint256 x) internal pure returns (uint256 r) {
        while (x > 1) {
            x >>= 1;
            r++;
        }
    }

    function testFuzz_highest_gate_matches_a_reference(uint256 passed) public view {
        vm.assume(passed != 0);
        assertEq(times.highestGate(passed), referenceHighest(passed), "highestGate against a Solidity loop");
    }

    function test_the_edges() public view {
        assertEq(times.highestGate(1), 0, "highestGate when only gate 0 passed");
        assertEq(times.highestGate(1 << 255), 255, "highestGate when only gate 255 passed");
        assertEq(times.highestGate(type(uint256).max), 255, "highestGate when every gate passed");
        assertEq(times.highestGate(0x8000_0000), 31, "highestGate when only gate 31 passed");
    }

    function test_no_gates_reverts_with_the_custom_error() public {
        vm.expectRevert(HillClimbTimes.NoGates.selector);
        times.highestGate(0);
    }
}
