contract WardrobeReturnTest is Test {
    CostumeWardrobe w;
    address ada = address(0xA11CE);
    address bo = address(0xB0B);

    function setUp() public {
        w = new CostumeWardrobe();
        w.addCostume(1, "Lion");
        w.addCostume(2, "Witch");
        w.addCostume(3, "Wardrobe");
        vm.prank(ada);
        w.allowCollector(bo, true);
    }

    function test_the_hirer_or_the_keeper_gives_back() public {
        vm.prank(ada);
        w.hire(1, ada);
        vm.prank(ada);
        w.hire(2, ada);

        vm.prank(ada);
        w.giveBack(1);
        w.giveBack(2); // the keeper takes it back
        assertEq(w.onHireBy(ada), 0, "costumes on hire after both came back");

        (, CostumeWardrobe.Status status, address hirer, uint256 timesHired) = w.costumes(2);
        assertEq(uint8(status), uint8(CostumeWardrobe.Status.Available), "the status after the keeper took it back");
        assertEq(hirer, address(0), "the hirer after the costume came back");
        assertEq(timesHired, 1, "timesHired is kept when the costume comes back");
        assertEq(w.availableIds().length, 3, "costumes available after both came back");
    }

    function test_others_cannot_give_back() public {
        vm.prank(bo);
        w.hire(1, ada);

        vm.prank(bo); // the collector is not the hirer
        vm.expectRevert(abi.encodeWithSelector(CostumeWardrobe.NotHirer.selector, 1, bo));
        w.giveBack(1);

        vm.prank(address(0xBAD));
        vm.expectRevert(abi.encodeWithSelector(CostumeWardrobe.NotHirer.selector, 1, address(0xBAD)));
        w.giveBack(1);
        assertEq(w.onHireBy(ada), 1, "costumes on hire after refused give-backs");
    }

    function test_only_costumes_on_hire_come_back() public {
        vm.expectRevert(abi.encodeWithSelector(CostumeWardrobe.NoSuchCostume.selector, 9));
        w.giveBack(9);
        vm.expectRevert(abi.encodeWithSelector(CostumeWardrobe.NotOnHire.selector, 3));
        w.giveBack(3);
    }

    function test_giving_back_frees_a_place() public {
        vm.prank(ada);
        w.hire(1, ada);
        vm.prank(ada);
        w.hire(2, ada);
        vm.prank(ada);
        w.giveBack(1);
        vm.prank(ada);
        w.hire(3, ada);
        vm.prank(ada);
        w.giveBack(3);
        vm.prank(ada);
        w.hire(3, ada);

        (,,, uint256 timesHired) = w.costumes(3);
        assertEq(timesHired, 2, "timesHired after two hires of the same costume");
        assertEq(w.onHireBy(ada), 2, "costumes on hire after giving back and hiring again");
    }

    function test_retire_resets_the_record_and_its_key() public {
        vm.prank(ada);
        w.hire(1, ada);
        vm.prank(ada);
        w.giveBack(1);

        w.retire(1);
        (string memory name, CostumeWardrobe.Status status, address hirer, uint256 timesHired) = w.costumes(1);
        assertEq(bytes(name).length, 0, "the name of a retired costume");
        assertEq(uint8(status), uint8(CostumeWardrobe.Status.Unknown), "the status of a retired costume");
        assertEq(hirer, address(0), "the hirer of a retired costume");
        assertEq(timesHired, 0, "timesHired of a retired costume");
        assertEq(w.costumeCount(), 2, "costumes after retiring one of three");
        assertEq(w.costumeIds(0), 3, "the last id moved into the retired id's place");
        assertEq(w.costumeIds(1), 2, "the id that did not move");

        w.addCostume(1, "New Lion");
        assertEq(w.costumeCount(), 3, "costumes after adding a retired id again");
        assertEq(w.costumeIds(2), 1, "the id added again goes to the end");
        (name,,, timesHired) = w.costumes(1);
        assertEq(name, "New Lion", "the name of the costume added under a retired id");
        assertEq(timesHired, 0, "timesHired of the costume added under a retired id");
    }

    function test_retire_rules() public {
        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(CostumeWardrobe.NotKeeper.selector, ada));
        w.retire(1);

        vm.expectRevert(abi.encodeWithSelector(CostumeWardrobe.NoSuchCostume.selector, 9));
        w.retire(9);

        vm.prank(ada);
        w.hire(2, ada);
        vm.expectRevert(abi.encodeWithSelector(CostumeWardrobe.NotAvailable.selector, 2, CostumeWardrobe.Status.OnHire));
        w.retire(2);
        assertEq(w.costumeCount(), 3, "costumes after refused retirements");
    }

    function test_retiring_every_costume() public {
        w.retire(2);
        w.retire(3);
        w.retire(1);
        assertEq(w.costumeCount(), 0, "costumes after retiring all three");
        assertEq(w.availableIds().length, 0, "costumes available after retiring all three");
    }
}
