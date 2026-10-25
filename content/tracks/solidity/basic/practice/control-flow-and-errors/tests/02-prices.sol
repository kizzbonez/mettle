contract BasketsPriceTest is Test {
    BerryBaskets day;

    function setUp() public {
        day = new BerryBaskets();
    }

    function test_every_order_size() public view {
        assertEq(day.priceOf(1), 0.01 ether, "the price of one basket");
        assertEq(day.priceOf(2), 0.019 ether, "the price of two baskets");
        assertEq(day.priceOf(3), 0.0271 ether, "the price of three baskets");
        assertEq(day.priceOf(4), 0.03439 ether, "the price of four baskets");
        assertEq(day.priceOf(5), 0.040951 ether, "the price of five baskets");
        assertEq(day.priceOf(6), 0.046951 ether, "the price of six baskets, where the floor starts");
        assertEq(day.priceOf(7), 0.052951 ether, "the price of seven baskets");
        assertEq(day.priceOf(8), 0.058951 ether, "the price of eight baskets");
    }

    function test_baskets_after_the_floor_cost_the_floor() public view {
        assertEq(day.priceOf(6) - day.priceOf(5), 0.006 ether, "the sixth basket costs the floor price");
        assertEq(day.priceOf(7) - day.priceOf(6), 0.006 ether, "the seventh basket costs the floor price");
        assertEq(day.priceOf(8) - day.priceOf(7), 0.006 ether, "the eighth basket costs the floor price");
    }

    function test_rejects_an_empty_order() public {
        vm.expectRevert(BerryBaskets.NoBaskets.selector);
        day.priceOf(0);
    }

    function testFuzz_rejects_orders_over_the_maximum(uint256 baskets) public {
        baskets = bound(baskets, 9, type(uint256).max);
        vm.expectRevert(abi.encodeWithSelector(BerryBaskets.OrderTooLarge.selector, baskets, 8));
        day.priceOf(baskets);
    }

    function testFuzz_each_basket_costs_between_floor_and_first_price(uint256 baskets) public view {
        baskets = bound(baskets, 2, 8);
        uint256 extra = day.priceOf(baskets) - day.priceOf(baskets - 1);
        assertGe(extra, 0.006 ether, "a further basket costs at least the floor price");
        assertLt(extra, 0.01 ether, "a further basket costs less than the first basket");
    }
}
