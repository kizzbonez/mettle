// The example day from the instructions: 120 and 95 bundles, four pickers.
contract ExampleDayTest is Test {
    function test_example_day() public {
        HarvestDay day = new HarvestDay();
        assertEq(day.BUNDLE_PRICE(), 4_000_000_000_000_000, "BUNDLE_PRICE in wei");

        uint256 each = day.share(120, 95, 4);
        console.log("one picker's share, in wei:", each);
        assertEq(each, 215_000_000_000_000_000, "each picker's share of 120 + 95 bundles among 4");
    }
}
