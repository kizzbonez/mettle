contract DeadlinesTest is Test {
    event Listed(uint256 indexed id, address indexed seller, uint256 reserve, uint256 endsAt);
    event Settled(uint256 indexed id, address indexed winner, uint256 price, uint256 fee);

    address master = makeAddr("harbour master");
    address skipper = makeAddr("skipper");
    address ada = makeAddr("ada");
    address ben = makeAddr("ben");
    HarbourCredit credit;
    FishAuction auction;
    uint256 constant START = 2_000_000;

    function setUp() public {
        vm.warp(START);
        credit = new HarbourCredit(master);
        auction = new FishAuction(credit, master, Bps.wrap(100));
        address[2] memory buyers = [ada, ben];
        for (uint256 i = 0; i < buyers.length; i++) {
            vm.prank(master);
            credit.mint(buyers[i], 10_000e18);
            vm.prank(buyers[i]);
            credit.approve(address(auction), type(uint256).max);
        }
    }

    function _list(uint256 duration) internal returns (uint256) {
        vm.prank(skipper);
        return auction.list(1e18, duration);
    }

    function test_listing_numbers_and_announces_each_catch() public {
        vm.expectEmit(address(auction));
        emit Listed(1, skipper, 1e18, START + 30 minutes);
        assertEq(_list(30 minutes), 1, "the first id");
        assertEq(_list(1 hours), 2, "the second id");
        assertEq(auction.auctionCount(), 2, "the number of auctions");
        FishAuction.Auction memory a = auction.auctionOf(2);
        assertEq(a.seller, skipper, "the seller");
        assertEq(a.endsAt, START + 1 hours, "the end of the second auction");
        assertEq(a.reserve, 1e18, "the reserve");
    }

    function test_a_listing_needs_a_duration() public {
        vm.prank(skipper);
        vm.expectRevert(FishAuction.ZeroDuration.selector);
        auction.list(1e18, 0);
    }

    function test_bids_are_taken_until_the_second_before_the_end() public {
        uint256 id = _list(1 hours);
        vm.warp(START + 1 hours - 1);
        vm.prank(ada);
        auction.bid(id, 2e18);
        uint256 endsAt = auction.auctionOf(id).endsAt;
        vm.warp(endsAt);
        vm.prank(ben);
        vm.expectRevert(abi.encodeWithSelector(FishAuction.AuctionEnded.selector, id));
        auction.bid(id, 5e18);
    }

    function test_a_bid_with_exactly_five_minutes_left_does_not_extend() public {
        uint256 id = _list(1 hours);
        vm.warp(START + 1 hours - 5 minutes);
        vm.prank(ada);
        auction.bid(id, 2e18);
        assertEq(auction.auctionOf(id).endsAt, START + 1 hours, "the end after a bid with five minutes left");
    }

    function test_a_bid_with_less_than_five_minutes_left_extends() public {
        uint256 id = _list(1 hours);
        uint256 bidAt = START + 1 hours - 5 minutes + 1;
        vm.warp(bidAt);
        vm.prank(ada);
        auction.bid(id, 2e18);
        assertEq(auction.auctionOf(id).endsAt, bidAt + 5 minutes, "the end after a bid with 4:59 left");
    }

    function testFuzz_a_bid_leaves_at_least_five_minutes(uint256 bidAt) public {
        uint256 id = _list(1 hours);
        bidAt = bound(bidAt, START, START + 1 hours - 1);
        vm.warp(bidAt);
        vm.prank(ada);
        auction.bid(id, 2e18);
        uint256 expected = START + 1 hours;
        if (expected - bidAt < 5 minutes) expected = bidAt + 5 minutes;
        assertEq(auction.auctionOf(id).endsAt, expected, "the end after a bid");
    }

    function test_settling_waits_for_the_end() public {
        uint256 id = _list(1 hours);
        vm.warp(START + 1 hours - 1);
        vm.expectRevert(abi.encodeWithSelector(FishAuction.AuctionNotEnded.selector, id, START + 1 hours));
        auction.settle(id);
        vm.warp(START + 1 hours);
        auction.settle(id);
        assertTrue(auction.auctionOf(id).settled, "whether the auction is settled");
    }

    function test_an_auction_settles_only_once() public {
        uint256 id = _list(1 hours);
        vm.prank(ada);
        auction.bid(id, 10e18);
        vm.warp(START + 1 hours);
        auction.settle(id);
        vm.expectRevert(abi.encodeWithSelector(FishAuction.AlreadySettled.selector, id));
        auction.settle(id);
        assertEq(auction.withdrawable(skipper), 9.9e18, "the proceeds after settling twice");
    }

    function test_a_catch_nobody_bid_on_settles_with_nothing_paid() public {
        uint256 id = _list(1 hours);
        vm.warp(START + 2 hours);
        vm.expectEmit(address(auction));
        emit Settled(id, address(0), 0, 0);
        auction.settle(id);
        assertEq(auction.withdrawable(skipper), 0, "the proceeds of an unsold catch");
        assertEq(auction.withdrawable(master), 0, "the fee on an unsold catch");
    }

    function test_unknown_auctions_cannot_be_settled() public {
        vm.expectRevert(abi.encodeWithSelector(FishAuction.UnknownAuction.selector, 7));
        auction.settle(7);
    }
}
