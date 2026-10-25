contract BoatLogExampleTest is Test {
    function test_example() public {
        BoatLog club = new BoatLog();
        club.addBoat("Kingfisher");
        club.addBoat("Heron");

        club.logOuting(0, 2000);
        BoatLog.Boat memory kingfisher = club.boat(0);
        assertEq(kingfisher.outings, 1, "outings of boat 0 after logOuting");
        assertEq(kingfisher.metres, 2000, "metres of boat 0 after logOuting");

        uint256[] memory ids = new uint256[](3);
        ids[1] = 1; // [0, 1, 0]
        uint256[] memory distances = new uint256[](3);
        distances[0] = 1500;
        distances[1] = 3000;
        distances[2] = 500;
        club.logOutings(ids, distances);

        kingfisher = club.boat(0);
        BoatLog.Boat memory heron = club.boat(1);
        assertEq(kingfisher.outings, 3, "outings of boat 0 after the batch");
        assertEq(kingfisher.metres, 4000, "metres of boat 0 after the batch");
        assertEq(heron.outings, 1, "outings of boat 1 after the batch");
        assertEq(heron.metres, 3000, "metres of boat 1 after the batch");

        vm.expectRevert(abi.encodeWithSelector(BoatLog.LengthMismatch.selector, 3, 2));
        club.logOutings(ids, new uint256[](2));

        ExampleCaptain captain = new ExampleCaptain();
        vm.expectRevert(abi.encodeWithSelector(BoatLog.TooManyThisTransaction.selector, 25));
        captain.twoBatches(club, 20, 6); // one transaction: 26 outings

        captain.batch(club, 20); // two transactions: 20, then 6
        captain.batch(club, 6);
        assertEq(club.boat(0).outings, 29, "outings of boat 0 after batches sent as two transactions");
    }
}

/// Sends batches of 1000-metre outings for boat 0 from a contract, so that several can share
/// one transaction.
contract ExampleCaptain {
    function batch(BoatLog club, uint256 size) public {
        uint256[] memory ids = new uint256[](size);
        uint256[] memory distances = new uint256[](size);
        for (uint256 i = 0; i < size; i++) {
            distances[i] = 1000;
        }
        club.logOutings(ids, distances);
    }

    function twoBatches(BoatLog club, uint256 first, uint256 second) external {
        batch(club, first);
        batch(club, second);
    }
}
