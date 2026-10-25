contract UnevenSharesTest is Test {
    HarvestDay day;

    function setUp() public {
        day = new HarvestDay();
    }

    function test_odd_bundles_between_two() public view {
        assertEq(day.share(3, 4, 2), 0.014 ether, "the share of 7 bundles between two pickers");
    }

    function test_one_bundle_among_three() public view {
        assertEq(day.share(0, 1, 3), 1_333_333_333_333_333, "the share of 1 bundle among three pickers");
    }

    function test_a_day_without_bundles() public view {
        assertEq(day.share(0, 0, 5), 0, "the share of a day without bundles");
    }
}
