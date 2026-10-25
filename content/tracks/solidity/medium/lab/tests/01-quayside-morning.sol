/// The morning from the instructions, step by step.
contract QuaysideMorningTest is Test {
    event Listed(uint256 indexed id, address indexed seller, uint256 reserve, uint256 endsAt);
    event BidPlaced(uint256 indexed id, address indexed bidder, uint256 amount, uint256 endsAt);
    event Settled(uint256 indexed id, address indexed winner, uint256 price, uint256 fee);

    function test_a_morning_at_the_quayside() public {
        address master = makeAddr("harbour master");
        address skipper = makeAddr("skipper");
        address ada = makeAddr("ada");
        address ben = makeAddr("ben");

        HarbourCredit credit = new HarbourCredit(master);
        FishAuction auction = new FishAuction(credit, master, Bps.wrap(250));
        vm.startPrank(master);
        credit.mint(ada, 1_000e18);
        credit.mint(ben, 1_000e18);
        vm.stopPrank();
        vm.prank(ada);
        credit.approve(address(auction), type(uint256).max);
        vm.prank(ben);
        credit.approve(address(auction), type(uint256).max);

        // 06:00: the skipper lists a box of mackerel, reserve 100 HBC, for one hour.
        vm.warp(1_000_000);
        uint256 end = 1_000_000 + 1 hours;
        vm.expectEmit(address(auction));
        emit Listed(1, skipper, 100e18, end);
        vm.prank(skipper);
        uint256 id = auction.list(100e18, 1 hours);
        assertEq(id, 1, "the first auction's id");

        vm.expectEmit(address(auction));
        emit BidPlaced(id, ada, 100e18, end);
        vm.prank(ada);
        auction.bid(id, 100e18);

        // A raise of less than 5% is refused, with the minimum in the error.
        vm.prank(ben);
        vm.expectRevert(abi.encodeWithSelector(FishAuction.BidTooLow.selector, id, 105e18));
        auction.bid(id, 104e18);
        vm.prank(ben);
        auction.bid(id, 105e18);
        assertEq(auction.withdrawable(ada), 100e18, "ada's outbid 100 HBC, credited back to her");

        // One minute before the end, ada bids again: the end moves to five minutes from now.
        vm.warp(end - 1 minutes);
        vm.prank(ada);
        auction.bid(id, 120e18);
        uint256 newEnd = end - 1 minutes + 5 minutes;
        assertEq(auction.auctionOf(id).endsAt, newEnd, "the end after a late bid");

        vm.warp(end);
        vm.expectRevert(abi.encodeWithSelector(FishAuction.AuctionNotEnded.selector, id, newEnd));
        auction.settle(id);

        vm.warp(newEnd);
        vm.expectEmit(address(auction));
        emit Settled(id, ada, 120e18, 3e18);
        auction.settle(id);
        assertEq(auction.withdrawable(skipper), 117e18, "the skipper's proceeds after the 2.5% fee");
        assertEq(auction.withdrawable(master), 3e18, "the harbour's fee");

        address[4] memory everyone = [ada, ben, skipper, master];
        for (uint256 i = 0; i < everyone.length; i++) {
            vm.prank(everyone[i]);
            auction.withdraw();
        }
        assertEq(credit.balanceOf(ada), 880e18, "ada's HBC after buying for 120");
        assertEq(credit.balanceOf(ben), 1_000e18, "ben's HBC after being outbid");
        assertEq(credit.balanceOf(skipper), 117e18, "the skipper's HBC");
        assertEq(credit.balanceOf(master), 3e18, "the harbour master's HBC");
        assertEq(credit.balanceOf(address(auction)), 0, "the HBC left in the auction");
    }
}
