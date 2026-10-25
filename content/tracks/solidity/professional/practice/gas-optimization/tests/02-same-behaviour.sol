contract SameBehaviourTest is Test {
    event PassIssued(uint256 indexed id, address indexed holder, uint48 validFrom, uint16 visits);
    event Visited(uint256 indexed id, uint256 visitsLeft);
    event PassCancelled(uint256 indexed id);

    GardenPasses garden;
    address constant ADA = address(0xADA);
    address constant BEN = address(0xBE4);

    function setUp() public {
        vm.warp(1_000_000);
        garden = new GardenPasses();
    }

    function test_only_the_warden_issues_and_cancels() public {
        assertEq(garden.warden(), address(this), "the warden is the deployer");
        vm.prank(BEN);
        vm.expectRevert(abi.encodeWithSelector(GardenPasses.NotWarden.selector, BEN));
        garden.issue(BEN, 1_000_000, 1);

        garden.issue(ADA, 1_000_000, 1);
        vm.prank(ADA);
        vm.expectRevert(abi.encodeWithSelector(GardenPasses.NotWarden.selector, ADA));
        garden.cancel(1);

        uint256[] memory ids = new uint256[](1);
        ids[0] = 1;
        vm.prank(ADA);
        vm.expectRevert(abi.encodeWithSelector(GardenPasses.NotWarden.selector, ADA));
        garden.checkInGroup(ids);
    }

    function test_issue_numbers_passes_and_stores_them() public {
        assertEq(garden.issue(ADA, 1_500_000, 4), 1, "the id of the first pass");
        assertEq(garden.issue(BEN, 2_000_000, 65_535), 2, "the id of the second pass");
        assertEq(garden.passCount(), 2, "passCount after two passes");
        (address holder, uint48 validFrom, uint16 visitsLeft, bool active) = garden.passOf(2);
        assertEq(holder, BEN, "the holder of pass 2");
        assertEq(validFrom, 2_000_000, "the start time of pass 2");
        assertEq(visitsLeft, 65_535, "the visits of pass 2");
        assertTrue(active, "a new pass is active");
        (holder,,,) = garden.passOf(9);
        assertEq(holder, address(0), "a pass that was never issued has no holder");
    }

    function test_check_in_rules_and_their_errors() public {
        garden.issue(ADA, 2_000_000, 1);
        vm.prank(BEN);
        vm.expectRevert(abi.encodeWithSelector(GardenPasses.NotHolder.selector, 1, BEN));
        garden.checkIn(1);

        vm.prank(ADA);
        vm.expectRevert(abi.encodeWithSelector(GardenPasses.TooEarly.selector, 1, 2_000_000));
        garden.checkIn(1);

        vm.warp(2_000_000);
        vm.prank(ADA);
        garden.checkIn(1);
        vm.prank(ADA);
        vm.expectRevert(abi.encodeWithSelector(GardenPasses.NoVisitsLeft.selector, 1));
        garden.checkIn(1);

        garden.issue(ADA, 1_000_000, 5);
        vm.expectEmit(address(garden));
        emit PassCancelled(2);
        garden.cancel(2);
        vm.prank(ADA);
        vm.expectRevert(abi.encodeWithSelector(GardenPasses.PassNotActive.selector, 2));
        garden.checkIn(2);
        vm.expectRevert(abi.encodeWithSelector(GardenPasses.PassNotActive.selector, 2));
        garden.cancel(2);
        assertEq(garden.totalVisits(), 1, "totalVisits counts only the visit that succeeded");
    }

    function testFuzz_a_pass_gives_exactly_its_visits(uint16 visits) public {
        visits = uint16(bound(visits, 1, 40));
        garden.issue(ADA, 1_000_000, visits);
        for (uint256 i = 1; i <= visits; i++) {
            vm.prank(ADA);
            vm.expectEmit(address(garden));
            emit Visited(1, visits - i);
            garden.checkIn(1);
        }
        (,, uint16 left, bool active) = garden.passOf(1);
        assertEq(left, 0, "visits left after using them all");
        assertTrue(active, "a used-up pass stays active");
        assertEq(garden.totalVisits(), visits, "totalVisits after using every visit");
        vm.prank(ADA);
        vm.expectRevert(abi.encodeWithSelector(GardenPasses.NoVisitsLeft.selector, 1));
        garden.checkIn(1);
    }

    function test_seeds_rules_and_their_errors() public {
        garden.issue(ADA, 1_000_000, 1);
        vm.prank(BEN);
        vm.expectRevert(abi.encodeWithSelector(GardenPasses.NotHolder.selector, 1, BEN));
        garden.claimSeeds(1);
        vm.prank(ADA);
        garden.claimSeeds(1);
        vm.prank(ADA);
        vm.expectRevert(abi.encodeWithSelector(GardenPasses.SeedsAlreadyClaimed.selector, 1));
        garden.claimSeeds(1);
    }
}
