contract BoatLogBatchTest is Test {
    BoatLog club;

    function setUp() public {
        club = new BoatLog();
        club.addBoat("Kingfisher");
        club.addBoat("Heron");
        club.addBoat("Swift");
    }

    function filled(uint256 size, uint256 value) internal pure returns (uint256[] memory list) {
        list = new uint256[](size);
        for (uint256 i = 0; i < size; i++) {
            list[i] = value;
        }
    }

    function test_a_batch_updates_each_boat() public {
        uint256[] memory ids = new uint256[](4);
        uint256[] memory distances = new uint256[](4);
        ids[0] = 2;
        distances[0] = 100;
        ids[1] = 0;
        distances[1] = 200;
        ids[2] = 2;
        distances[2] = 300;
        ids[3] = 2;
        distances[3] = 400;
        club.logOutings(ids, distances);

        assertEq(club.boat(0).outings, 1, "outings of boat 0 after the batch");
        assertEq(club.boat(0).metres, 200, "metres of boat 0 after the batch");
        assertEq(club.boat(1).outings, 0, "outings of a boat not in the batch");
        assertEq(club.boat(2).outings, 3, "outings of a boat that appears three times");
        assertEq(club.boat(2).metres, 800, "metres of a boat that appears three times");
    }

    function test_lengths_must_match() public {
        vm.expectRevert(abi.encodeWithSelector(BoatLog.LengthMismatch.selector, 2, 3));
        club.logOutings(new uint256[](2), filled(3, 1000));

        vm.expectRevert(abi.encodeWithSelector(BoatLog.LengthMismatch.selector, 3, 0));
        club.logOutings(new uint256[](3), new uint256[](0));

        // The lengths are compared before the size of the batch.
        vm.expectRevert(abi.encodeWithSelector(BoatLog.LengthMismatch.selector, 21, 20));
        club.logOutings(new uint256[](21), filled(20, 1000));
    }

    function test_twenty_entries_at_most() public {
        club.logOutings(new uint256[](20), filled(20, 1000));
        assertEq(club.boat(0).outings, 20, "outings after a batch of twenty");

        vm.expectRevert(abi.encodeWithSelector(BoatLog.BatchTooLarge.selector, 21, 20));
        club.logOutings(new uint256[](21), filled(21, 1000));
    }

    function test_an_empty_batch_does_nothing() public {
        club.logOutings(new uint256[](0), new uint256[](0));
        assertEq(club.boat(0).outings, 0, "outings after an empty batch");
    }

    function test_one_bad_entry_refuses_the_whole_batch() public {
        uint256[] memory ids = new uint256[](3);
        ids[2] = 9; // boat 9 does not exist
        vm.expectRevert(abi.encodeWithSelector(BoatLog.NoSuchBoat.selector, 9));
        club.logOutings(ids, filled(3, 1000));

        uint256[] memory distances = filled(3, 1000);
        distances[1] = 0;
        ids[2] = 1;
        vm.expectRevert(abi.encodeWithSelector(BoatLog.ZeroDistance.selector, 0));
        club.logOutings(ids, distances);

        assertEq(club.boat(0).outings, 0, "outings of boat 0 after two refused batches");
        assertEq(club.boat(1).outings, 0, "outings of boat 1 after two refused batches");
    }

    function testFuzz_batch_totals(uint256 size, uint256 metres) public {
        size = bound(size, 0, 20);
        metres = bound(metres, 1, 1e9);
        uint256[] memory ids = new uint256[](size);
        for (uint256 i = 0; i < size; i++) {
            ids[i] = i % 3;
        }
        club.logOutings(ids, filled(size, metres));

        uint256 outings = club.boat(0).outings + club.boat(1).outings + club.boat(2).outings;
        uint256 total = club.boat(0).metres + club.boat(1).metres + club.boat(2).metres;
        assertEq(outings, size, "outings logged by a batch, over all boats");
        assertEq(total, size * metres, "metres logged by a batch, over all boats");
    }
}
