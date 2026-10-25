import {IERC20Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";

contract BiddingRulesTest is Test {
    event BidPlaced(uint256 indexed id, address indexed bidder, uint256 amount, uint256 endsAt);

    address master = makeAddr("harbour master");
    address skipper = makeAddr("skipper");
    address ada = makeAddr("ada");
    address ben = makeAddr("ben");
    HarbourCredit credit;
    FishAuction auction;
    uint256 id;

    function setUp() public {
        credit = new HarbourCredit(master);
        auction = new FishAuction(credit, master, Bps.wrap(300));
        address[3] memory buyers = [ada, ben, skipper];
        for (uint256 i = 0; i < buyers.length; i++) {
            vm.prank(master);
            credit.mint(buyers[i], 10_000e18);
            vm.prank(buyers[i]);
            credit.approve(address(auction), type(uint256).max);
        }
        vm.prank(skipper);
        id = auction.list(50e18, 2 hours);
    }

    function test_unknown_auctions_are_refused() public {
        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(FishAuction.UnknownAuction.selector, 0));
        auction.bid(0, 60e18);
        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(FishAuction.UnknownAuction.selector, 2));
        auction.bid(2, 60e18);
        vm.expectRevert(abi.encodeWithSelector(FishAuction.UnknownAuction.selector, 2));
        auction.minimumBid(2);
    }

    function test_the_seller_cannot_bid_on_their_own_catch() public {
        vm.prank(skipper);
        vm.expectRevert(FishAuction.SellerCannotBid.selector);
        auction.bid(id, 60e18);
    }

    function test_the_first_bid_must_meet_the_reserve() public {
        assertEq(auction.minimumBid(id), 50e18, "the minimum before any bid");
        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(FishAuction.BidTooLow.selector, id, 50e18));
        auction.bid(id, 50e18 - 1);
        vm.prank(ada);
        auction.bid(id, 50e18);
    }

    function test_a_catch_without_reserve_still_needs_a_bid_above_zero() public {
        vm.prank(skipper);
        uint256 free = auction.list(0, 1 hours);
        assertEq(auction.minimumBid(free), 1, "the minimum with no reserve");
        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(FishAuction.BidTooLow.selector, free, 1));
        auction.bid(free, 0);
    }

    function test_each_bid_must_beat_the_last_by_five_percent() public {
        vm.prank(ada);
        auction.bid(id, 80e18);
        assertEq(auction.minimumBid(id), 84e18, "the minimum after a bid of 80 HBC");
        vm.prank(ben);
        vm.expectRevert(abi.encodeWithSelector(FishAuction.BidTooLow.selector, id, 84e18));
        auction.bid(id, 84e18 - 1);
        vm.prank(ben);
        auction.bid(id, 84e18);
    }

    function test_a_tiny_bid_must_still_be_beaten_by_one() public {
        vm.prank(skipper);
        uint256 cheap = auction.list(10, 1 hours);
        vm.prank(ada);
        auction.bid(cheap, 10);
        assertEq(auction.minimumBid(cheap), 11, "the minimum after a bid of 10 wei");
        vm.prank(ben);
        vm.expectRevert(abi.encodeWithSelector(FishAuction.BidTooLow.selector, cheap, 11));
        auction.bid(cheap, 10);
    }

    function test_an_outbid_bid_is_credited_not_sent() public {
        vm.prank(ada);
        auction.bid(id, 100e18);
        vm.prank(ben);
        auction.bid(id, 200e18);
        assertEq(auction.withdrawable(ada), 100e18, "ada's credit after being outbid");
        assertEq(credit.balanceOf(ada), 9_900e18, "ada's wallet after being outbid, before withdrawing");
        assertEq(credit.balanceOf(address(auction)), 300e18, "the HBC the auction holds");

        FishAuction.Auction memory a = auction.auctionOf(id);
        assertEq(a.highestBidder, ben, "the highest bidder");
        assertEq(a.highestBid, 200e18, "the highest bid");
    }

    function test_a_bid_is_announced() public {
        uint256 endsAt = auction.auctionOf(id).endsAt;
        vm.expectEmit(address(auction));
        emit BidPlaced(id, ada, 75e18, endsAt);
        vm.prank(ada);
        auction.bid(id, 75e18);
    }

    function test_a_bid_needs_an_allowance() public {
        address carl = makeAddr("carl");
        vm.prank(master);
        credit.mint(carl, 100e18);
        vm.prank(carl);
        vm.expectRevert(
            abi.encodeWithSelector(IERC20Errors.ERC20InsufficientAllowance.selector, address(auction), 0, 60e18)
        );
        auction.bid(id, 60e18);
    }

    function testFuzz_the_auction_holds_every_live_bid(uint256 first, uint256 second, uint256 third) public {
        first = bound(first, 50e18, 1_000e18);
        second = bound(second, first + first * 500 / 10_000, 2_000e18);
        third = bound(third, second + second * 500 / 10_000, 4_000e18);
        vm.prank(ada);
        auction.bid(id, first);
        vm.prank(ben);
        auction.bid(id, second);
        vm.prank(ada);
        auction.bid(id, third);
        assertEq(auction.withdrawable(ada), first, "ada's credit");
        assertEq(auction.withdrawable(ben), second, "ben's credit");
        assertEq(credit.balanceOf(address(auction)), first + second + third, "the HBC the auction holds");
    }
}
