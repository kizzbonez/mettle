contract HiveRollFilterTest is Test {
    HiveRoll roll;

    function setUp() public {
        roll = new HiveRoll();
        roll.addHive("Heather");
        roll.addHive("Clover");
        roll.addHive("Hawthorn");
        roll.addHive("heath");
        roll.addHive("Holly");
    }

    function test_names_by_first_letter_in_roll_order() public view {
        string[] memory found = roll.hivesStartingWith("H");
        assertEq(found.length, 3, "names starting with a capital H");
        assertEq(found[0], "Heather", "the first name starting with H");
        assertEq(found[1], "Hawthorn", "the second name starting with H");
        assertEq(found[2], "Holly", "the third name starting with H");

        found = roll.hivesStartingWith("h");
        assertEq(found.length, 1, "names starting with a small h");
        assertEq(found[0], "heath", "the name starting with a small h");
    }

    function test_no_match_gives_an_empty_array() public {
        assertEq(roll.hivesStartingWith("Z").length, 0, "names starting with a letter no hive has");
        HiveRoll empty = new HiveRoll();
        assertEq(empty.hivesStartingWith("H").length, 0, "names on an empty roll");
    }

    function test_filter_follows_removals() public {
        roll.removeHive(0);
        string[] memory found = roll.hivesStartingWith("H");
        assertEq(found.length, 2, "names starting with H after one was removed");
        assertEq(found[0], "Holly", "the hive that moved to the front");
        assertEq(found[1], "Hawthorn", "the hive that stayed in place");
    }

    function test_plaques() public view {
        assertEq(roll.plaque(0, "Ada"), "Heather - kept by Ada", "the plaque of the first hive");
        assertEq(roll.plaque(4, unicode"Zoë"), unicode"Holly - kept by Zoë", "the plaque with a non-ASCII keeper");
        assertEq(roll.plaque(1, ""), "Clover - kept by ", "the plaque with an empty keeper");
    }

    function test_plaque_of_a_missing_hive() public {
        vm.expectRevert(abi.encodeWithSelector(HiveRoll.NoSuchHive.selector, 5, 5));
        roll.plaque(5, "Ada");
    }
}
