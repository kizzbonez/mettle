contract BudgetsTest is Test {
    GardenPasses garden;
    address constant ADA = address(0xADA);

    function setUp() public {
        vm.warp(1_000_000);
        garden = new GardenPasses();
        garden.issue(ADA, 1_000_000, 10);
        vm.prank(ADA);
        garden.checkIn(1);
    }

    function test_issue_within_budget() public {
        garden.issue(address(0xB0B), 1_200_000, 7);
        assertLt(vm.lastFrameGas().gasTotalUsed, 65_000, "gas used by issue() for a second pass");
        (address holder,, uint16 visits,) = garden.passOf(2);
        assertEq(holder, address(0xB0B), "the holder of the pass issued under budget");
        assertEq(visits, 7, "the visits of the pass issued under budget");
    }

    function test_check_in_within_budget() public {
        vm.prank(ADA);
        garden.checkIn(1);
        assertLt(vm.lastFrameGas().gasTotalUsed, 37_000, "gas used by checkIn() after an earlier visit");
        (,, uint16 left,) = garden.passOf(1);
        assertEq(left, 8, "visits left after two visits");
    }

    function test_cancel_within_budget() public {
        garden.cancel(1);
        assertLt(vm.lastFrameGas().gasTotalUsed, 29_500, "gas used by cancel()");
        (,,, bool active) = garden.passOf(1);
        assertFalse(active, "the cancelled pass is inactive");
    }
}
