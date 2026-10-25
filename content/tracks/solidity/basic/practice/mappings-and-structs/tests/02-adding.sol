contract WardrobeAddingTest is Test {
    CostumeWardrobe w;

    function setUp() public {
        w = new CostumeWardrobe();
    }

    function test_a_new_costume_is_stored_and_listed() public {
        w.addCostume(7, "Mermaid");
        (string memory name, CostumeWardrobe.Status status, address hirer, uint256 timesHired) = w.costumes(7);
        assertEq(name, "Mermaid", "the name of a new costume");
        assertEq(uint8(status), uint8(CostumeWardrobe.Status.Available), "the status of a new costume");
        assertEq(hirer, address(0), "the hirer of a new costume");
        assertEq(timesHired, 0, "timesHired of a new costume");
        assertEq(w.costumeCount(), 1, "costumes after adding one");
        assertEq(w.costumeIds(0), 7, "the id pushed to costumeIds");
    }

    function test_any_number_is_an_id() public {
        w.addCostume(0, "Ghost");
        w.addCostume(type(uint256).max, "Dragon");
        w.addCostume(42, "Pirate");
        assertEq(w.costumeIds(0), 0, "the first id in costumeIds");
        assertEq(w.costumeIds(1), type(uint256).max, "the second id in costumeIds");
        assertEq(w.costumeIds(2), 42, "the third id in costumeIds");
        (string memory name,,,) = w.costumes(0);
        assertEq(name, "Ghost", "the costume stored under id 0");
    }

    function testFuzz_only_the_keeper_adds(address stranger) public {
        vm.assume(stranger != address(this));
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(CostumeWardrobe.NotKeeper.selector, stranger));
        w.addCostume(1, "Lion");
        assertEq(w.costumeCount(), 0, "costumes after a stranger tried to add one");
    }

    function test_an_id_cannot_be_reused() public {
        w.addCostume(1, "Lion");
        vm.expectRevert(abi.encodeWithSelector(CostumeWardrobe.CostumeExists.selector, 1));
        w.addCostume(1, "Tin Man");

        w.hire(1, address(this));
        vm.expectRevert(abi.encodeWithSelector(CostumeWardrobe.CostumeExists.selector, 1));
        w.addCostume(1, "Tin Man");

        (string memory name, CostumeWardrobe.Status status, address hirer,) = w.costumes(1);
        assertEq(name, "Lion", "the name after a refused second add");
        assertEq(uint8(status), uint8(CostumeWardrobe.Status.OnHire), "the status after a refused second add");
        assertEq(hirer, address(this), "the hirer after a refused second add");
        assertEq(w.costumeCount(), 1, "costumes after refused second adds");
    }

    function test_the_wardrobe_holds_one_hundred() public {
        for (uint256 i = 0; i < 100; i++) {
            w.addCostume(1000 + i, "Extra");
        }
        assertEq(w.costumeCount(), 100, "costumes after adding one hundred");

        vm.expectRevert(abi.encodeWithSelector(CostumeWardrobe.WardrobeFull.selector, 100));
        w.addCostume(1, "Lion");

        // An id already in use is reported before a full wardrobe.
        vm.expectRevert(abi.encodeWithSelector(CostumeWardrobe.CostumeExists.selector, 1000));
        w.addCostume(1000, "Lion");

        vm.prank(address(0xBAD));
        vm.expectRevert(abi.encodeWithSelector(CostumeWardrobe.NotKeeper.selector, address(0xBAD)));
        w.addCostume(1, "Lion");
    }
}
