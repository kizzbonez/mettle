contract BunkNumbersTest is Test {
    function test_numbers_bunks_in_order() public {
        HutBunks hut = new HutBunks(12);
        (uint256 first,) = hut.checkIn(1);
        assertEq(first, 1, "the first bunk of the first party");
        (first,) = hut.checkIn(4);
        assertEq(first, 2, "the first bunk of the second party");
        (first,) = hut.checkIn(2);
        assertEq(first, 6, "the first bunk of the third party");
    }

    function test_one_party_fills_the_hut() public {
        HutBunks hut = new HutBunks(12);
        (uint256 first, uint256 left) = hut.checkIn(12);
        assertEq(first, 1, "the first bunk of a party that fills the hut");
        assertEq(left, 0, "bunks left in a full hut");
        assertEq(hut.taken(), 12, "bunks taken in a full hut");
    }
}
