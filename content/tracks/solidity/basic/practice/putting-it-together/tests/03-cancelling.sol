contract CancellingTest is Test {
    uint256 constant PRICE = 0.02 ether;

    SupperTickets tickets;
    address organiser = address(0x0e6);
    address ada = address(0xA11CE);

    function setUp() public {
        vm.prank(organiser);
        tickets = new SupperTickets(PRICE, 50);
        vm.deal(ada, 1 ether);
        vm.prank(ada);
        tickets.buy{value: 2 * PRICE}(2);
    }

    function testFuzz_only_the_organiser_cancels(address stranger) public {
        vm.assume(stranger != organiser);
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(SupperTickets.NotOrganiser.selector, stranger));
        tickets.cancel();
        assertEq(uint256(tickets.stage()), uint256(SupperTickets.Stage.OnSale), "stage after a refused cancel");
    }

    function test_cannot_cancel_twice() public {
        vm.prank(organiser);
        tickets.cancel();
        assertEq(uint256(tickets.stage()), uint256(SupperTickets.Stage.Cancelled), "stage after cancelling");

        vm.prank(organiser);
        vm.expectRevert(abi.encodeWithSelector(SupperTickets.WrongStage.selector, SupperTickets.Stage.Cancelled));
        tickets.cancel();
    }

    function test_cannot_cancel_after_collecting() public {
        vm.prank(organiser);
        tickets.collectTakings();
        vm.prank(organiser);
        vm.expectRevert(abi.encodeWithSelector(SupperTickets.WrongStage.selector, SupperTickets.Stage.Collected));
        tickets.cancel();
    }

    function test_no_refunds_while_on_sale() public {
        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(SupperTickets.WrongStage.selector, SupperTickets.Stage.OnSale));
        tickets.claimRefund();
    }

    function test_no_takings_after_cancelling() public {
        vm.prank(organiser);
        tickets.cancel();
        vm.prank(organiser);
        vm.expectRevert(abi.encodeWithSelector(SupperTickets.WrongStage.selector, SupperTickets.Stage.Cancelled));
        tickets.collectTakings();
        assertEq(address(tickets).balance, 2 * PRICE, "ether kept for the refunds");
    }
}
