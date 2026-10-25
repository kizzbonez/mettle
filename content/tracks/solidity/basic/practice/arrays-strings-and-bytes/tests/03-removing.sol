contract HiveRollRemovingTest is Test {
    HiveRoll roll;

    function setUp() public {
        roll = new HiveRoll();
        roll.addHive("Clover");
        roll.addHive("Heather");
        roll.addHive("Lime");
        roll.addHive("Borage");
    }

    function test_the_last_hive_fills_the_gap() public {
        roll.removeHive(1);
        assertEq(roll.hiveCount(), 3, "hives after removing one of four");
        assertEq(roll.hives(0), "Clover", "the hive before the removed one");
        assertEq(roll.hives(1), "Borage", "the last hive moved into the removed hive's place");
        assertEq(roll.hives(2), "Lime", "the hive after the removed one");
    }

    function test_removing_the_last_hive() public {
        roll.removeHive(3);
        assertEq(roll.hiveCount(), 3, "hives after removing the last one");
        assertEq(roll.hives(2), "Lime", "the new last hive");
    }

    function test_removing_every_hive() public {
        roll.removeHive(0);
        roll.removeHive(0);
        roll.removeHive(0);
        roll.removeHive(0);
        assertEq(roll.hiveCount(), 0, "hives after removing all four");

        vm.expectRevert(abi.encodeWithSelector(HiveRoll.NoSuchHive.selector, 0, 0));
        roll.removeHive(0);
    }

    function testFuzz_rejects_indexes_past_the_end(uint256 index) public {
        index = bound(index, 4, type(uint256).max);
        vm.expectRevert(abi.encodeWithSelector(HiveRoll.NoSuchHive.selector, index, 4));
        roll.removeHive(index);
        assertEq(roll.hiveCount(), 4, "hives after a refused removal");
    }

    function test_a_removed_name_can_come_back() public {
        roll.removeHive(0);
        roll.addHive("Clover");
        assertEq(roll.hiveCount(), 4, "hives after adding a removed name again");
        assertEq(roll.hives(3), "Clover", "the name added again goes to the end");
    }

    function test_a_full_roll_has_room_after_a_removal() public {
        for (uint256 i = 0; i < 46; i++) {
            roll.addHive(string(bytes.concat("hive-", bytes1(uint8(97 + i / 26)), bytes1(uint8(97 + (i % 26))))));
        }
        assertEq(roll.hiveCount(), 50, "hives on a full roll");
        roll.removeHive(10);
        roll.addHive("Latecomer");
        assertEq(roll.hiveCount(), 50, "hives after removing one and adding one to a full roll");
        assertEq(roll.hives(49), "Latecomer", "the latecomer takes the last place");
    }
}
