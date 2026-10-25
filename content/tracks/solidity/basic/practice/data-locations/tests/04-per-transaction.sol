contract BoatLogPerTransactionTest is Test {
    BoatLog club;
    CapCaptain captain;

    function setUp() public {
        club = new BoatLog();
        club.addBoat("Kingfisher");
        captain = new CapCaptain();
    }

    function test_twenty_five_single_outings_in_one_transaction() public {
        captain.singles(club, 25);
        assertEq(club.boat(0).outings, 25, "outings after 25 in one transaction");

        vm.expectRevert(abi.encodeWithSelector(BoatLog.TooManyThisTransaction.selector, 25));
        captain.singles(club, 26);
        assertEq(club.boat(0).outings, 25, "outings after a refused transaction of 26");
    }

    function test_the_limit_starts_again_in_every_transaction() public {
        for (uint256 i = 0; i < 30; i++) {
            club.logOuting(0, 1000); // each call from the test is its own transaction
        }
        assertEq(club.boat(0).outings, 30, "outings after 30 separate transactions");

        captain.singles(club, 25);
        captain.singles(club, 25);
        assertEq(club.boat(0).outings, 80, "outings after two more transactions of 25");
    }

    function test_batches_and_singles_share_the_limit() public {
        captain.batchThenSingles(club, 20, 5);
        assertEq(club.boat(0).outings, 25, "outings after a batch of 20 and 5 singles in one transaction");

        vm.expectRevert(abi.encodeWithSelector(BoatLog.TooManyThisTransaction.selector, 25));
        captain.batchThenSingles(club, 20, 6);

        vm.expectRevert(abi.encodeWithSelector(BoatLog.TooManyThisTransaction.selector, 25));
        captain.twoBatches(club, 20, 6);
        assertEq(club.boat(0).outings, 25, "outings after two refused transactions");
    }

    function test_a_refused_transaction_leaves_the_next_one_its_full_limit() public {
        vm.expectRevert(abi.encodeWithSelector(BoatLog.TooManyThisTransaction.selector, 25));
        captain.singles(club, 30);
        captain.twoBatches(club, 20, 5);
        assertEq(club.boat(0).outings, 25, "outings after a refused transaction and a full one");
    }
}

/// Logs 1000-metre outings for boat 0 from a contract, so that several share one transaction.
contract CapCaptain {
    function singles(BoatLog club, uint256 times) public {
        for (uint256 i = 0; i < times; i++) {
            club.logOuting(0, 1000);
        }
    }

    function batch(BoatLog club, uint256 size) public {
        uint256[] memory ids = new uint256[](size);
        uint256[] memory distances = new uint256[](size);
        for (uint256 i = 0; i < size; i++) {
            distances[i] = 1000;
        }
        club.logOutings(ids, distances);
    }

    function batchThenSingles(BoatLog club, uint256 size, uint256 times) external {
        batch(club, size);
        singles(club, times);
    }

    function twoBatches(BoatLog club, uint256 first, uint256 second) external {
        batch(club, first);
        batch(club, second);
    }
}
