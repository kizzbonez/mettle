contract WardrobeExampleTest is Test {
    address ada = address(0xA11CE);
    address bo = address(0xB0B);

    function test_example() public {
        CostumeWardrobe w = new CostumeWardrobe();
        w.addCostume(1, "Lion");
        w.addCostume(2, "Witch");
        assertEq(w.costumeCount(), 2, "costumes after adding two");

        vm.prank(ada);
        w.allowCollector(bo, true);
        vm.prank(bo);
        w.hire(1, ada);

        (string memory name, CostumeWardrobe.Status status, address hirer, uint256 timesHired) = w.costumes(1);
        assertEq(name, "Lion", "the name of costume 1");
        assertEq(uint8(status), uint8(CostumeWardrobe.Status.OnHire), "the status of a hired costume");
        assertEq(hirer, ada, "the hirer of a costume a collector hired for Ada");
        assertEq(timesHired, 1, "timesHired after one hire");
        assertEq(w.onHireBy(ada), 1, "costumes Ada has on hire");

        uint256[] memory ids = w.availableIds();
        assertEq(ids.length, 1, "costumes available while costume 1 is on hire");
        assertEq(ids[0], 2, "the costume still available");

        vm.prank(bo);
        vm.expectRevert(abi.encodeWithSelector(CostumeWardrobe.NotHirer.selector, 1, bo));
        w.giveBack(1);

        vm.prank(ada);
        w.giveBack(1);
        (, status, hirer, timesHired) = w.costumes(1);
        assertEq(uint8(status), uint8(CostumeWardrobe.Status.Available), "the status of a costume given back");
        assertEq(hirer, address(0), "the hirer of a costume given back");
        assertEq(timesHired, 1, "timesHired after the costume came back");

        w.retire(2);
        (name, status, hirer, timesHired) = w.costumes(2);
        assertEq(bytes(name).length, 0, "the name of a retired costume");
        assertEq(uint8(status), uint8(CostumeWardrobe.Status.Unknown), "the status of a retired costume");
        assertEq(w.costumeCount(), 1, "costumes after retiring one");
        assertEq(w.costumeIds(0), 1, "the id left in costumeIds");
    }
}
