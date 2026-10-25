// The two parties from the instructions, in a hut of 12 bunks.
contract TwoPartiesTest is Test {
    function test_two_parties() public {
        address keeper = address(0x77A2D);
        address ada = address(0xADA);
        address bo = address(0xB0);

        vm.prank(keeper);
        HutBunks hut = new HutBunks(12);
        assertEq(hut.warden(), keeper, "the warden, who deployed the hut");

        vm.prank(ada);
        (uint256 first, uint256 left) = hut.checkIn(3);
        console.log("Ada's party: first bunk", first, "bunks left", left);
        assertEq(first, 1, "the first bunk of Ada's party");
        assertEq(left, 9, "bunks left after Ada's party of 3");
        assertEq(hut.lastLeader(), ada, "the last leader after Ada checked in");

        vm.prank(bo);
        (first, left) = hut.checkIn(2);
        console.log("Bo's party: first bunk", first, "bunks left", left);
        assertEq(first, 4, "the first bunk of Bo's party");
        assertEq(left, 7, "bunks left after Bo's party of 2");
        assertEq(hut.lastLeader(), bo, "the last leader after Bo checked in");
        assertEq(hut.taken(), 5, "bunks taken by both parties");
        assertEq(hut.freeBunks(), 7, "freeBunks after both parties");
    }
}
