contract LeaderTest is Test {
    function testFuzz_records_any_leader(address leader) public {
        HutBunks hut = new HutBunks(10);
        vm.prank(leader);
        hut.checkIn(1);
        assertEq(hut.lastLeader(), leader, "the last leader, after a check-in from that account");
        assertEq(hut.warden(), address(this), "the warden, which a check-in leaves alone");
    }

    function test_the_latest_leader_replaces_the_earlier_one() public {
        HutBunks hut = new HutBunks(10);
        vm.prank(address(0xC1));
        hut.checkIn(2);
        vm.prank(address(0xD2));
        hut.checkIn(2);
        assertEq(hut.lastLeader(), address(0xD2), "the last leader after two check-ins");
    }
}
