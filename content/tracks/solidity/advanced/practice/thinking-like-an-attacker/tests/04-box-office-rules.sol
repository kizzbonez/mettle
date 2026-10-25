contract BoxOfficeRulesTest is Test {
    event TicketSold(address indexed buyer, uint256 indexed seat);

    PuppetShow show;
    address organiser = makeAddr("organiser");
    address ada = makeAddr("ada");
    address mallory = makeAddr("mallory");

    function setUp() public {
        vm.warp(1_000_000);
        vm.prank(organiser);
        show = new PuppetShow(1_000_000 + 7 days);
        vm.deal(ada, 1 ether);
        vm.deal(mallory, 1 ether);
        vm.prank(ada);
        show.buy{value: 0.05 ether}(7);
    }

    function testFuzz_buys_any_free_seat(uint256 seat) public {
        seat = bound(seat, 0, 39);
        vm.assume(seat != 7);
        vm.expectEmit(address(show));
        emit TicketSold(mallory, seat);
        vm.prank(mallory);
        show.buy{value: 0.05 ether}(seat);
        assertEq(show.holderOf(seat), mallory, "the holder of the seat just bought");
        assertEq(show.sold(), 2, "seats sold");
    }

    function test_rejects_bad_purchases() public {
        vm.startPrank(mallory);
        vm.expectRevert(abi.encodeWithSelector(PuppetShow.NoSuchSeat.selector, 40));
        show.buy{value: 0.05 ether}(40);
        vm.expectRevert(abi.encodeWithSelector(PuppetShow.SeatTaken.selector, 7));
        show.buy{value: 0.05 ether}(7);
        vm.expectRevert(abi.encodeWithSelector(PuppetShow.WrongPayment.selector, 0.04 ether));
        show.buy{value: 0.04 ether}(8);
        vm.stopPrank();
    }

    function test_sales_close_at_the_start_and_on_cancellation() public {
        vm.warp(show.showStarts());
        vm.prank(mallory);
        vm.expectRevert(PuppetShow.SalesClosed.selector);
        show.buy{value: 0.05 ether}(8);

        vm.warp(show.showStarts() - 1 days);
        vm.prank(organiser);
        show.cancelShow();
        vm.prank(mallory);
        vm.expectRevert(PuppetShow.SalesClosed.selector);
        show.buy{value: 0.05 ether}(8);
    }

    function test_only_the_organiser_cancels() public {
        vm.prank(mallory);
        vm.expectRevert(abi.encodeWithSelector(PuppetShow.NotOrganiser.selector, mallory));
        show.cancelShow();
        assertFalse(show.cancelled(), "the show is cancelled after a stranger tried");
    }

    function test_refund_rules() public {
        uint256[] memory seat7 = new uint256[](1);
        seat7[0] = 7;
        vm.prank(ada);
        vm.expectRevert(PuppetShow.NotCancelled.selector);
        show.refund(seat7);

        vm.prank(organiser);
        show.cancelShow();
        vm.prank(mallory);
        vm.expectRevert(abi.encodeWithSelector(PuppetShow.NotYourSeat.selector, 7));
        show.refund(seat7);

        vm.prank(ada);
        show.refund(seat7);
        assertEq(ada.balance, 1 ether, "ada's ether after her refund");
        assertEq(show.sold(), 0, "seats sold after the only refund");
    }
}
