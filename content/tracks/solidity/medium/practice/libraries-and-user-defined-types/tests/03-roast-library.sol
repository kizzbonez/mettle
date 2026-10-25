/// Calls the library from outside, so that a revert inside it can be expected.
contract RoastLibraryHarness {
    function roasted(Grams green, uint256 lossBps) external pure returns (Grams) {
        return Roast.roasted(green, lossBps);
    }

    function greenNeeded(Grams target, uint256 lossBps) external pure returns (Grams) {
        return Roast.greenNeeded(target, lossBps);
    }
}

contract RoastLibraryTest is Test {
    RoastLibraryHarness harness;

    function setUp() public {
        harness = new RoastLibraryHarness();
    }

    function test_roasted_weights() public view {
        assertEq(Grams.unwrap(harness.roasted(Grams.wrap(2_000), 1_800)), 1_640, "2,000 g roasted with an 18% loss");
        assertEq(Grams.unwrap(harness.roasted(Grams.wrap(7), 1_500)), 5, "7 g roasted with a 15% loss, rounded down");
        assertEq(Grams.unwrap(harness.roasted(Grams.wrap(3_333), 0)), 3_333, "a roast that loses nothing");
        assertEq(Grams.unwrap(harness.roasted(Grams.wrap(9_999), 1)), 9_998, "a loss of one basis point");
    }

    function test_roasted_multiplies_before_dividing() public view {
        assertEq(Grams.unwrap(harness.roasted(Grams.wrap(9_000), 1_500)), 7_650, "9,000 g roasted with a 15% loss");
    }

    function test_green_needed() public view {
        assertEq(Grams.unwrap(harness.greenNeeded(Grams.wrap(850), 1_500)), 1_000, "green for 850 g at 15%: exact");
        assertEq(
            Grams.unwrap(harness.greenNeeded(Grams.wrap(1_000), 1_700)), 1_205, "green for 1,000 g at 17%: rounded up"
        );
        assertEq(Grams.unwrap(harness.greenNeeded(Grams.wrap(0), 1_500)), 0, "green for nothing");
        assertEq(Grams.unwrap(harness.greenNeeded(Grams.wrap(40), 0)), 40, "green when nothing is lost");
    }

    function test_impossible_losses_are_refused() public {
        vm.expectRevert(abi.encodeWithSelector(Roast.LossTooHigh.selector, 10_000));
        harness.roasted(Grams.wrap(100), 10_000);
        vm.expectRevert(abi.encodeWithSelector(Roast.LossTooHigh.selector, 10_000));
        harness.greenNeeded(Grams.wrap(100), 10_000);
        vm.expectRevert(abi.encodeWithSelector(Roast.LossTooHigh.selector, 12_000));
        harness.greenNeeded(Grams.wrap(100), 12_000);
    }

    function testFuzz_green_needed_is_enough_and_minimal(uint64 target, uint16 loss) public view {
        uint256 lossBps = bound(loss, 0, 9_000);
        Grams green = harness.greenNeeded(Grams.wrap(target), lossBps);
        Grams out = harness.roasted(green, lossBps);
        assertFalse(out < Grams.wrap(target), "roasting the green weight needed gives at least the target");
        if (Grams.unwrap(green) > 0) {
            Grams less = harness.roasted(Grams.wrap(Grams.unwrap(green) - 1), lossBps);
            assertTrue(less < Grams.wrap(target), "one gram less of green would not be enough");
        }
    }
}
