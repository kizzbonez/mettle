contract HiveRollAddingTest is Test {
    HiveRoll roll;

    function setUp() public {
        roll = new HiveRoll();
    }

    /// A name of `length` bytes: "abcdef...", repeating after z.
    function nameOf(uint256 length) internal pure returns (string memory) {
        bytes memory name = new bytes(length);
        for (uint256 i = 0; i < length; i++) {
            name[i] = bytes1(uint8(97 + (i % 26)));
        }
        return string(name);
    }

    function test_rejects_an_empty_name() public {
        vm.expectRevert(HiveRoll.EmptyName.selector);
        roll.addHive("");
        assertEq(roll.hiveCount(), 0, "hives after refusing an empty name");
    }

    function test_limit_is_sixteen_bytes() public {
        roll.addHive("Sixteen-byte-nam");
        assertEq(roll.hiveCount(), 1, "hives after adding a name of exactly 16 bytes");

        vm.expectRevert(abi.encodeWithSelector(HiveRoll.NameTooLong.selector, 17, 16));
        roll.addHive("Seventeen-byte-nm");
    }

    function test_length_is_counted_in_bytes() public {
        roll.addHive(unicode"Königin");
        assertEq(roll.hives(0), unicode"Königin", "a name with a non-ASCII letter is stored as it was given");

        // 15 characters, but each ö takes two bytes: 17 bytes in all.
        vm.expectRevert(abi.encodeWithSelector(HiveRoll.NameTooLong.selector, 17, 16));
        roll.addHive(unicode"Bienenstöckeöab");
    }

    function testFuzz_names_up_to_the_limit(uint256 length) public {
        length = bound(length, 1, 40);
        if (length > 16) {
            vm.expectRevert(abi.encodeWithSelector(HiveRoll.NameTooLong.selector, length, 16));
            roll.addHive(nameOf(length));
        } else {
            roll.addHive(nameOf(length));
            assertEq(roll.hives(0), nameOf(length), "a name within the limit is stored");
        }
    }

    function test_duplicates_are_refused_anywhere_in_the_roll() public {
        roll.addHive("Clover");
        roll.addHive("Heather");
        roll.addHive("Lime");

        vm.expectRevert(abi.encodeWithSelector(HiveRoll.DuplicateName.selector, "Clover"));
        roll.addHive("Clover");
        vm.expectRevert(abi.encodeWithSelector(HiveRoll.DuplicateName.selector, "Heather"));
        roll.addHive("Heather");
        vm.expectRevert(abi.encodeWithSelector(HiveRoll.DuplicateName.selector, "Lime"));
        roll.addHive("Lime");
        assertEq(roll.hiveCount(), 3, "hives after refusing duplicates");
    }

    function test_names_differ_by_case_and_length() public {
        roll.addHive("Clover");
        roll.addHive("clover");
        roll.addHive("Clove");
        roll.addHive("Clovers");
        assertEq(roll.hiveCount(), 4, "names that differ by case or length are all accepted");
    }

    /// Fifty different names: "hive-aa", "hive-ab", ...
    function hiveName(uint256 i) internal pure returns (string memory) {
        return string(bytes.concat("hive-", bytes1(uint8(97 + i / 26)), bytes1(uint8(97 + (i % 26)))));
    }

    function test_roll_is_capped_at_fifty() public {
        for (uint256 i = 0; i < 50; i++) {
            roll.addHive(hiveName(i));
        }
        assertEq(roll.hiveCount(), 50, "hives after adding fifty different names");

        vm.expectRevert(abi.encodeWithSelector(HiveRoll.RollFull.selector, 50));
        roll.addHive("Latecomer");

        // The cheap checks come first: a long name is refused as too long even when the roll is full.
        vm.expectRevert(abi.encodeWithSelector(HiveRoll.NameTooLong.selector, 17, 16));
        roll.addHive("Seventeen-byte-nm");
        vm.expectRevert(HiveRoll.EmptyName.selector);
        roll.addHive("");

        // A full roll is reported before a duplicate is searched for.
        vm.expectRevert(abi.encodeWithSelector(HiveRoll.RollFull.selector, 50));
        roll.addHive("hive-aa");
        assertEq(roll.hiveCount(), 50, "hives after refusing names on a full roll");
    }
}
