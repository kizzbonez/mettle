contract OrchardExampleTest is Test {
    function test_example() public {
        OrchardTrees orchard = new OrchardTrees();
        address ana = makeAddr("ana");
        address ben = makeAddr("ben");
        address cara = makeAddr("cara");

        vm.prank(ana);
        assertEq(orchard.adopt(), 1, "the id of the first adopted tree");
        assertEq(orchard.ownerOf(1), ana, "the owner of tree 1");
        assertEq(orchard.tokenURI(1), "https://orchard.example/trees/1", "the tokenURI of tree 1");

        vm.prank(ben);
        assertEq(orchard.adopt(), 2, "the id of the second adopted tree");

        vm.prank(ana);
        vm.expectRevert(abi.encodeWithSelector(OrchardTrees.AlreadyAdopted.selector, ana));
        orchard.adopt();

        vm.prank(ana);
        orchard.safeTransferFrom(ana, ben, 1);
        assertEq(orchard.balanceOf(ben), 2, "ben's certificates after ana gives him hers");

        vm.prank(cara);
        assertEq(orchard.adopt(), 3, "the id of the third adopted tree");
        vm.prank(cara);
        vm.expectRevert(abi.encodeWithSelector(OrchardTrees.TooManyTrees.selector, ben));
        orchard.transferFrom(cara, ben, 3);
    }
}
