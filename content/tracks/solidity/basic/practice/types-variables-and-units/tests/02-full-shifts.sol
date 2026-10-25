contract FullShiftsTest is Test {
    HarvestDay day;

    function setUp() public {
        day = new HarvestDay();
    }

    function test_two_full_shifts_for_one_picker() public view {
        assertEq(day.share(255, 255, 1), 2.04 ether, "the share of 255 + 255 bundles for one picker");
    }

    function test_two_full_shifts_for_two_pickers() public view {
        assertEq(day.share(255, 255, 2), 1.02 ether, "the share of 255 + 255 bundles between two pickers");
    }

    function test_sum_just_over_a_uint8() public view {
        assertEq(day.share(200, 100, 3), 0.4 ether, "the share of 200 + 100 bundles among three pickers");
    }
}
