contract RefundOnceTest is Test {
    event Refunded(address indexed holder, uint256 seats, uint256 amount);

    PuppetShow show;
    address organiser = makeAddr("organiser");
    address ada = makeAddr("ada");
    address ben = makeAddr("ben");
    address mallory = makeAddr("mallory");

    function setUp() public {
        vm.warp(1_000_000);
        vm.prank(organiser);
        show = new PuppetShow(1_000_000 + 7 days);
        hoax(ada, 1 ether);
        show.buy{value: 0.05 ether}(7);
        vm.deal(ben, 1 ether);
        vm.startPrank(ben);
        show.buy{value: 0.05 ether}(8);
        show.buy{value: 0.05 ether}(9);
        vm.stopPrank();
        vm.deal(mallory, 0.1 ether);
        vm.startPrank(mallory);
        show.buy{value: 0.05 ether}(3);
        show.buy{value: 0.05 ether}(4);
        vm.stopPrank();
        vm.prank(organiser);
        show.cancelShow();
    }

    function list3(uint256 a, uint256 b, uint256 c) internal pure returns (uint256[] memory list) {
        list = new uint256[](3);
        list[0] = a;
        list[1] = b;
        list[2] = c;
    }

    function test_attack_the_same_seat_twice() public {
        uint256[] memory seats = new uint256[](2);
        seats[0] = 3;
        seats[1] = 3;
        vm.prank(mallory);
        try show.refund(seats) {} catch {}
        uint256[] memory seat4 = new uint256[](1);
        seat4[0] = 4;
        vm.prank(mallory);
        try show.refund(seat4) {} catch {}

        assertLe(mallory.balance, 0.1 ether, "mallory's ether after refunding seat 3 twice, then seat 4");
        assertGe(address(show).balance, 0.15 ether, "ether left for the other holders' refunds");
    }

    function test_attack_a_seat_repeated_further_down_the_list() public {
        vm.prank(mallory);
        vm.expectRevert(abi.encodeWithSelector(PuppetShow.NotYourSeat.selector, 3));
        show.refund(list3(3, 4, 3));
    }

    function testFuzz_attack_any_repeated_seat(uint8 first, uint8 second, uint8 third) public {
        // mallory holds seats 3 and 4; build a list of three with at least one repeat
        uint256[] memory seats = list3(3 + (first % 2), 3 + (second % 2), 3 + (third % 2));
        vm.prank(mallory);
        try show.refund(seats) {} catch {}

        assertLe(mallory.balance, 0.1 ether, "mallory's ether after a refund list with a repeat");
        assertGe(address(show).balance, 0.15 ether, "ether left for the other holders' refunds");
    }

    function test_refunds_several_seats_in_any_order() public {
        uint256[] memory seats = new uint256[](2);
        seats[0] = 9;
        seats[1] = 8;
        vm.expectEmit(address(show));
        emit Refunded(ben, 2, 0.1 ether);
        vm.prank(ben);
        show.refund(seats);

        assertEq(ben.balance, 1 ether, "ben's ether after refunding two seats");
        assertEq(show.sold(), 3, "seats still sold after ben's refund");
        assertEq(show.holderOf(9), address(0), "the holder of seat 9 after its refund");
    }

    function test_a_refunded_seat_cannot_be_refunded_again() public {
        uint256[] memory seat8 = new uint256[](1);
        seat8[0] = 8;
        vm.prank(ben);
        show.refund(seat8);

        vm.prank(ben);
        vm.expectRevert(abi.encodeWithSelector(PuppetShow.NotYourSeat.selector, 8));
        show.refund(seat8);
        assertEq(ben.balance, 0.95 ether, "ben's ether after one refund of seat 8");
    }
}
