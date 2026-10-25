contract BunksLeftTest is Test {
    function testFuzz_left_matches_the_getters(uint256 a, uint256 b) public {
        HutBunks hut = new HutBunks(40);
        uint256 firstParty = bound(a, 1, 20);
        uint256 secondParty = bound(b, 1, 20);

        (, uint256 left) = hut.checkIn(firstParty);
        assertEq(left, 40 - firstParty, "bunks left after the first party");
        (uint256 start, uint256 leftAfter) = hut.checkIn(secondParty);
        assertEq(start, firstParty + 1, "the first bunk of the second party");
        assertEq(leftAfter, hut.freeBunks(), "bunks left, compared with freeBunks()");
        assertEq(hut.taken(), firstParty + secondParty, "bunks taken by both parties");
        assertEq(leftAfter + hut.taken(), hut.bunks(), "bunks left plus bunks taken");
    }
}
