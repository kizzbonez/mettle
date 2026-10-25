contract BoatLogSavingTest is Test {
    BoatLog club;

    function setUp() public {
        club = new BoatLog();
        club.addBoat("Kingfisher");
        club.addBoat("Heron");
        club.addBoat("Swift");
    }

    function test_outings_add_up_in_storage() public {
        club.logOuting(1, 2000);
        club.logOuting(1, 2500);
        club.logOuting(1, 1250);

        BoatLog.Boat memory heron = club.boat(1);
        assertEq(heron.name, "Heron", "the name of boat 1 after its outings");
        assertEq(heron.outings, 3, "outings of boat 1 after three outings");
        assertEq(heron.metres, 5750, "metres of boat 1 after three outings");

        (string memory name, uint256 outings, uint256 metres) = club.boats(1);
        assertEq(name, "Heron", "the name read through the public getter");
        assertEq(outings, 3, "outings read through the public getter");
        assertEq(metres, 5750, "metres read through the public getter");
    }

    function test_other_boats_are_untouched() public {
        club.logOuting(2, 4000);
        assertEq(club.boat(0).outings, 0, "outings of a boat that did not go out");
        assertEq(club.boat(1).metres, 0, "metres of a boat that did not go out");
        assertEq(club.boat(2).outings, 1, "outings of the boat that went out");
    }

    function testFuzz_two_outings(uint256 first, uint256 second) public {
        first = bound(first, 1, 1e12);
        second = bound(second, 1, 1e12);
        club.logOuting(0, first);
        club.logOuting(0, second);
        assertEq(club.boat(0).outings, 2, "outings after two outings");
        assertEq(club.boat(0).metres, first + second, "metres after two outings");
    }

    function test_refuses_unknown_boats_and_zero_distances() public {
        vm.expectRevert(abi.encodeWithSelector(BoatLog.NoSuchBoat.selector, 3));
        club.logOuting(3, 1000);

        vm.expectRevert(abi.encodeWithSelector(BoatLog.ZeroDistance.selector, 2));
        club.logOuting(2, 0);

        vm.expectRevert(abi.encodeWithSelector(BoatLog.NoSuchBoat.selector, 7));
        club.boat(7);

        BoatLog empty = new BoatLog();
        vm.expectRevert(abi.encodeWithSelector(BoatLog.NoSuchBoat.selector, 0));
        empty.logOuting(0, 1000);
    }
}
