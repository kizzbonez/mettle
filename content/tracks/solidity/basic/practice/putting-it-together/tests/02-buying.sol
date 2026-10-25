contract BuyingTest is Test {
    uint256 constant PRICE = 0.02 ether;
    uint256 constant CAPACITY = 50;

    SupperTickets tickets;
    address ada = address(0xA11CE);
    address bo = address(0xB0);

    function setUp() public {
        tickets = new SupperTickets(PRICE, CAPACITY);
        vm.deal(ada, 10 ether);
        vm.deal(bo, 10 ether);
    }

    function test_refuses_zero_seats() public {
        vm.prank(ada);
        vm.expectRevert(SupperTickets.ZeroSeats.selector);
        tickets.buy{value: PRICE}(0);
    }

    function test_refuses_an_underpayment() public {
        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(SupperTickets.Underpaid.selector, 3 * PRICE - 1, 3 * PRICE));
        tickets.buy{value: 3 * PRICE - 1}(3);
    }

    function test_fills_the_hall_exactly_and_no_further() public {
        vm.prank(ada);
        tickets.buy{value: 40 * PRICE}(40);

        vm.prank(bo);
        vm.expectRevert(abi.encodeWithSelector(SupperTickets.NotEnoughSeats.selector, 11, 10));
        tickets.buy{value: 11 * PRICE}(11);

        vm.prank(bo);
        tickets.buy{value: 10 * PRICE}(10);
        assertEq(tickets.seatsSold(), CAPACITY, "seats sold when the hall is full");

        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(SupperTickets.NotEnoughSeats.selector, 1, 0));
        tickets.buy{value: PRICE}(1);
    }

    function test_repeat_purchases_add_up() public {
        vm.prank(ada);
        tickets.buy{value: 2 * PRICE}(2);
        vm.prank(ada);
        tickets.buy{value: 5 * PRICE}(4);
        assertEq(tickets.seatsOf(ada), 6, "seats after two purchases");
        assertEq(tickets.credit(ada), PRICE, "change after paying for one seat too many");
    }

    function testFuzz_records_seats_and_change(uint256 seats, uint256 extra) public {
        seats = bound(seats, 1, CAPACITY);
        extra = bound(extra, 0, 1 ether);
        uint256 cost = seats * PRICE;

        vm.prank(ada);
        tickets.buy{value: cost + extra}(seats);

        assertEq(tickets.seatsOf(ada), seats, "the buyer's seats");
        assertEq(tickets.seatsSold(), seats, "seats sold");
        assertEq(tickets.credit(ada), extra, "the buyer's change");
        assertEq(address(tickets).balance, cost + extra, "ether held by the sale");
        assertEq(ada.balance, 10 ether - cost - extra, "ether the buyer paid");
    }
}
