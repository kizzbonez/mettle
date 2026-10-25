contract ExampleTest is Test {
    event TicketsBought(address indexed buyer, uint256 seats, uint256 cost);
    event SaleCancelled();
    event Refunded(address indexed buyer, uint256 amount);

    function test_example() public {
        address organiser = address(0x0e6);
        address ada = address(0xA11CE);
        address bo = address(0xB0);
        address cy = address(0xC1);
        vm.deal(ada, 1 ether);
        vm.deal(bo, 1 ether);
        vm.deal(cy, 1 ether);

        vm.prank(organiser);
        SupperTickets tickets = new SupperTickets(0.02 ether, 50);

        vm.expectEmit(address(tickets));
        emit TicketsBought(ada, 3, 0.06 ether);
        vm.prank(ada);
        tickets.buy{value: 0.07 ether}(3);
        assertEq(tickets.credit(ada), 0.01 ether, "Ada's change after paying 0.07 ether for 3 seats");

        vm.prank(bo);
        tickets.buy{value: 0.04 ether}(2);
        assertEq(tickets.seatsSold(), 5, "seats sold");

        vm.expectEmit(address(tickets));
        emit SaleCancelled();
        vm.prank(organiser);
        tickets.cancel();

        vm.expectEmit(address(tickets));
        emit Refunded(ada, 0.06 ether);
        vm.prank(ada);
        tickets.claimRefund();
        assertEq(ada.balance, 0.99 ether, "Ada's ether after the refund");

        vm.prank(ada);
        tickets.withdrawCredit();
        assertEq(ada.balance, 1 ether, "Ada's ether after withdrawing her change");

        vm.prank(cy);
        vm.expectRevert(abi.encodeWithSelector(SupperTickets.WrongStage.selector, SupperTickets.Stage.Cancelled));
        tickets.buy{value: 0.02 ether}(1);
    }
}
