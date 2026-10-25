contract BasketsReserveTest is Test {
    BerryBaskets day;

    function setUp() public {
        day = new BerryBaskets();
    }

    function fillTo56() internal {
        for (uint256 i = 0; i < 7; i++) {
            day.reserve(8);
        }
    }

    function test_checks_run_in_the_promised_order() public {
        fillTo56();
        assertEq(day.reserved(), 56, "baskets reserved after seven orders of eight");

        vm.expectRevert(BerryBaskets.NoBaskets.selector);
        day.reserve(0);

        vm.expectRevert(abi.encodeWithSelector(BerryBaskets.OrderTooLarge.selector, 9, 8));
        day.reserve(9);

        vm.expectRevert(abi.encodeWithSelector(BerryBaskets.SoldOut.selector, 4, 5));
        day.reserve(5);
    }

    function test_the_last_baskets_can_be_reserved() public {
        fillTo56();
        day.reserve(4);
        assertEq(day.reserved(), 60, "baskets reserved when an order takes exactly the last baskets");

        vm.expectRevert(abi.encodeWithSelector(BerryBaskets.SoldOut.selector, 0, 1));
        day.reserve(1);
    }

    function test_failed_orders_change_nothing() public {
        day.reserve(5);
        uint256 owedBefore = day.owed();

        vm.expectRevert(BerryBaskets.NoBaskets.selector);
        day.reserve(0);
        vm.expectRevert(abi.encodeWithSelector(BerryBaskets.OrderTooLarge.selector, 20, 8));
        day.reserve(20);

        assertEq(day.reserved(), 5, "baskets reserved after refused orders");
        assertEq(day.owed(), owedBefore, "wei owed after refused orders");
    }

    function test_each_order_is_priced_on_its_own() public {
        assertEq(day.reserve(3), 0.0271 ether, "the cost of a first order of three");
        assertEq(day.reserve(3), 0.0271 ether, "the cost of a second order of three");
        assertEq(day.reserve(1), 0.01 ether, "the cost of an order of one after others");
        assertEq(day.reserved(), 7, "baskets reserved after three orders");
        assertEq(day.owed(), 0.0642 ether, "wei owed after three orders");
    }

    function testFuzz_anyone_can_reserve(address family, uint256 baskets) public {
        baskets = bound(baskets, 1, 8);
        uint256 price = day.priceOf(baskets);
        vm.prank(family);
        assertEq(day.reserve(baskets), price, "the cost reserve returns to any caller");
        assertEq(day.reserved(), baskets, "baskets reserved by any caller");
        assertEq(day.owed(), price, "wei owed after any caller's order");
    }
}
