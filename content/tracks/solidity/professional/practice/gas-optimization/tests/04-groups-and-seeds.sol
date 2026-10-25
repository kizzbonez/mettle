contract GroupsAndSeedsTest is Test {
    GardenPasses garden;
    address constant ADA = address(0xADA);

    function setUp() public {
        vm.warp(1_000_000);
        garden = new GardenPasses();
        for (uint256 i = 0; i < 10; i++) {
            garden.issue(ADA, 1_000_000, 3);
        }
        vm.prank(ADA);
        garden.checkIn(1);
    }

    function firstTen() internal pure returns (uint256[] memory ids) {
        ids = new uint256[](10);
        for (uint256 i = 0; i < 10; i++) {
            ids[i] = i + 1;
        }
    }

    function test_group_check_in_within_budget() public {
        garden.checkInGroup(firstTen());
        assertLt(vm.lastFrameGas().gasTotalUsed, 125_000, "gas used by checkInGroup() for ten passes");
        assertEq(garden.totalVisits(), 11, "totalVisits after a group of ten");
        (,, uint16 left1,) = garden.passOf(1);
        (,, uint16 left10,) = garden.passOf(10);
        assertEq(left1, 1, "visits left on a pass used twice");
        assertEq(left10, 2, "visits left on a pass used once");
    }

    function test_a_bad_pass_stops_the_whole_group() public {
        garden.cancel(7);
        vm.expectRevert(abi.encodeWithSelector(GardenPasses.PassNotActive.selector, 7));
        garden.checkInGroup(firstTen());
        assertEq(garden.totalVisits(), 1, "totalVisits after a refused group");
        (,, uint16 left2,) = garden.passOf(2);
        assertEq(left2, 3, "visits left on a pass of the refused group");
    }

    function test_eight_claims_within_budget() public {
        uint256 total;
        for (uint256 id = 1; id <= 8; id++) {
            vm.prank(ADA);
            garden.claimSeeds(id);
            total += vm.lastFrameGas().gasTotalUsed;
        }
        assertLt(total, 290_000, "gas used by eight claimSeeds() calls for passes 1 to 8");
        assertTrue(garden.hasClaimedSeeds(8), "pass 8 has claimed its seeds");
        assertFalse(garden.hasClaimedSeeds(9), "pass 9 has not claimed its seeds");
    }

    function test_claims_far_apart_are_kept_apart() public {
        for (uint256 i = 11; i <= 600; i++) {
            garden.issue(ADA, 1_000_000, 1);
        }
        uint256[5] memory claimed = [uint256(255), 256, 257, 511, 512];
        for (uint256 i = 0; i < claimed.length; i++) {
            vm.prank(ADA);
            garden.claimSeeds(claimed[i]);
        }
        for (uint256 i = 0; i < claimed.length; i++) {
            assertTrue(garden.hasClaimedSeeds(claimed[i]), "a pass above 254 that claimed is recorded");
        }
        assertFalse(garden.hasClaimedSeeds(254), "pass 254 has not claimed");
        assertFalse(garden.hasClaimedSeeds(258), "pass 258 has not claimed");
        assertFalse(garden.hasClaimedSeeds(1), "pass 1 has not claimed");
        assertFalse(garden.hasClaimedSeeds(600), "pass 600 has not claimed");
        vm.prank(ADA);
        vm.expectRevert(abi.encodeWithSelector(GardenPasses.SeedsAlreadyClaimed.selector, 256));
        garden.claimSeeds(256);
    }

    function testFuzz_one_claim_marks_one_pass(uint16 id, uint16 other) public {
        uint256 claimId = bound(id, 1, 10);
        uint256 otherId = bound(other, 1, 10);
        vm.assume(claimId != otherId);
        vm.prank(ADA);
        garden.claimSeeds(claimId);
        assertTrue(garden.hasClaimedSeeds(claimId), "the pass that claimed is recorded");
        assertFalse(garden.hasClaimedSeeds(otherId), "another pass is not marked by the claim");
    }
}
