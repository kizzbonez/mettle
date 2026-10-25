contract BasketsExampleTest is Test {
    function test_example() public {
        BerryBaskets day = new BerryBaskets();
        assertEq(day.priceOf(1), 0.01 ether, "the price of one basket");
        assertEq(day.priceOf(3), 0.0271 ether, "the price of three baskets");
        assertEq(day.priceOf(6), 0.046951 ether, "the price of six baskets, which reaches the floor");

        assertEq(day.reserve(3), 0.0271 ether, "the cost reserve returns for three baskets");
        assertEq(day.reserved(), 3, "baskets reserved after one order of three");
        assertEq(day.owed(), 0.0271 ether, "wei owed after one order of three");

        vm.expectRevert(BerryBaskets.NoBaskets.selector);
        day.reserve(0);

        vm.expectRevert(abi.encodeWithSelector(BerryBaskets.OrderTooLarge.selector, 9, 8));
        day.reserve(9);

        assertEq(day.closeDay(), 0.0271 ether, "the takings closeDay returns");
        assertEq(day.reserved(), 0, "baskets reserved after closing the day");
        assertEq(day.owed(), 0, "wei owed after closing the day");
    }
}
