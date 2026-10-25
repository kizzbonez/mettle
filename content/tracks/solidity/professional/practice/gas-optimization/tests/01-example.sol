contract ExampleTest is Test {
    event PassIssued(uint256 indexed id, address indexed holder, uint48 validFrom, uint16 visits);
    event Visited(uint256 indexed id, uint256 visitsLeft);

    GardenPasses garden;
    address constant ADA = address(0xADA);

    function setUp() public {
        vm.warp(1_000_000);
        garden = new GardenPasses();
    }

    function test_example() public {
        vm.expectEmit(address(garden));
        emit PassIssued(1, ADA, 1_000_000, 3);
        garden.issue(ADA, 1_000_000, 3);

        garden.issue(ADA, 1_000_000, 3);
        uint256 issueGas = vm.lastFrameGas().gasTotalUsed;
        console.log("issue() of a second pass used", issueGas);

        vm.prank(ADA);
        vm.expectEmit(address(garden));
        emit Visited(1, 2);
        garden.checkIn(1);

        vm.prank(ADA);
        garden.checkIn(2);
        uint256 checkInGas = vm.lastFrameGas().gasTotalUsed;
        console.log("checkIn() after an earlier visit used", checkInGas);

        (address holder, uint48 validFrom, uint16 visitsLeft, bool active) = garden.passOf(1);
        assertEq(holder, ADA, "the holder of pass 1");
        assertEq(validFrom, 1_000_000, "the start time of pass 1");
        assertEq(visitsLeft, 2, "visits left on pass 1 after one visit");
        assertTrue(active, "pass 1 is active");
        assertEq(garden.totalVisits(), 2, "totalVisits after two visits");

        vm.prank(ADA);
        garden.claimSeeds(1);
        assertTrue(garden.hasClaimedSeeds(1), "pass 1 has claimed its seeds");
        assertFalse(garden.hasClaimedSeeds(2), "pass 2 has not claimed its seeds");

        assertLt(issueGas, 65_000, "gas used by issue() for a second pass");
        assertLt(checkInGas, 37_000, "gas used by checkIn() after an earlier visit");
    }
}
