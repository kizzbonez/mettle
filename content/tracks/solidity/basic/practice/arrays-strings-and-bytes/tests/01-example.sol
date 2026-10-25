contract HiveRollExampleTest is Test {
    function test_example() public {
        HiveRoll roll = new HiveRoll();
        roll.addHive("Clover");
        roll.addHive("Heather");
        roll.addHive("Lime");
        assertEq(roll.hiveCount(), 3, "hives after adding three");

        vm.expectRevert(abi.encodeWithSelector(HiveRoll.DuplicateName.selector, "Clover"));
        roll.addHive("Clover");

        roll.removeHive(0);
        assertEq(roll.hiveCount(), 2, "hives after removing one");
        assertEq(roll.hives(0), "Lime", "the hive moved into the removed hive's place");
        assertEq(roll.hives(1), "Heather", "the hive that did not move");

        string[] memory found = roll.hivesStartingWith("H");
        assertEq(found.length, 1, "names starting with H");
        assertEq(found[0], "Heather", "the name starting with H");

        assertEq(roll.plaque(1, "Ada"), "Heather - kept by Ada", "the plaque of the second hive");

        vm.expectRevert(abi.encodeWithSelector(HiveRoll.NoSuchHive.selector, 2, 2));
        roll.removeHive(2);
    }
}
