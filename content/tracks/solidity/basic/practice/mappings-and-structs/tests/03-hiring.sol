contract WardrobeHiringTest is Test {
    CostumeWardrobe w;
    address ada = address(0xA11CE);
    address bo = address(0xB0B);
    address cy = address(0xC1);

    function setUp() public {
        w = new CostumeWardrobe();
        w.addCostume(1, "Lion");
        w.addCostume(2, "Witch");
        w.addCostume(3, "Wardrobe");
    }

    function test_a_member_hires_for_themselves() public {
        vm.prank(ada);
        w.hire(2, ada);
        (, CostumeWardrobe.Status status, address hirer, uint256 timesHired) = w.costumes(2);
        assertEq(uint8(status), uint8(CostumeWardrobe.Status.OnHire), "the status of a hired costume");
        assertEq(hirer, ada, "the hirer of a costume a member hired");
        assertEq(timesHired, 1, "timesHired after the first hire");
        assertEq(w.onHireBy(ada), 1, "costumes on hire by the member");
        assertEq(w.availableIds().length, 2, "costumes available after one was hired");
    }

    function test_an_unknown_costume_cannot_be_hired() public {
        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(CostumeWardrobe.NoSuchCostume.selector, 99));
        w.hire(99, ada);

        // Unknown is reported before the caller's permission is checked.
        vm.prank(bo);
        vm.expectRevert(abi.encodeWithSelector(CostumeWardrobe.NoSuchCostume.selector, 99));
        w.hire(99, ada);
    }

    function testFuzz_strangers_cannot_hire_for_a_member(address stranger) public {
        vm.assume(stranger != ada);
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(CostumeWardrobe.NotAllowed.selector, ada, stranger));
        w.hire(1, ada);
        assertEq(w.onHireBy(ada), 0, "costumes on hire after a refused hire");
    }

    function test_an_allowed_collector_hires_for_the_member() public {
        vm.prank(ada);
        w.allowCollector(bo, true);

        vm.prank(bo);
        w.hire(1, ada);
        (,, address hirer,) = w.costumes(1);
        assertEq(hirer, ada, "the hirer is the member, not the collector");
        assertEq(w.onHireBy(ada), 1, "costumes on hire by the member");
        assertEq(w.onHireBy(bo), 0, "costumes on hire by the collector");

        // The permission belongs to Ada's entry: Bo did not allow Ada anything.
        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(CostumeWardrobe.NotAllowed.selector, bo, ada));
        w.hire(2, bo);

        vm.prank(ada);
        w.allowCollector(bo, false);
        vm.prank(bo);
        vm.expectRevert(abi.encodeWithSelector(CostumeWardrobe.NotAllowed.selector, ada, bo));
        w.hire(2, ada);
    }

    function test_a_costume_on_hire_is_not_available() public {
        vm.prank(ada);
        w.hire(1, ada);
        vm.prank(cy);
        vm.expectRevert(abi.encodeWithSelector(CostumeWardrobe.NotAvailable.selector, 1, CostumeWardrobe.Status.OnHire));
        w.hire(1, cy);

        (,, address hirer, uint256 timesHired) = w.costumes(1);
        assertEq(hirer, ada, "the hirer after a refused second hire");
        assertEq(timesHired, 1, "timesHired after a refused second hire");
    }

    function test_two_costumes_at_most() public {
        vm.prank(ada);
        w.hire(1, ada);
        vm.prank(ada);
        w.hire(2, ada);
        assertEq(w.onHireBy(ada), 2, "costumes on hire by a member with two");

        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(CostumeWardrobe.TooManyOnHire.selector, ada, 2));
        w.hire(3, ada);

        vm.prank(bo);
        w.hire(3, bo);
        assertEq(w.onHireBy(bo), 1, "another member's count is separate");
    }
}
