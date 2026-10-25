contract RoasteryLedgerTest is Test {
    event Roasted(Grams green, Grams roasted);

    Roastery shop;

    function setUp() public {
        shop = new Roastery(1_600);
        shop.receiveGreen(Grams.wrap(10_000));
    }

    function test_roast_moves_the_stock() public {
        vm.expectEmit(address(shop));
        emit Roasted(Grams.wrap(2_500), Grams.wrap(2_100));
        Grams out = shop.roast(Grams.wrap(2_500));
        assertEq(Grams.unwrap(out), 2_100, "the roasted weight of 2,500 g at a 16% loss");
        assertEq(Grams.unwrap(shop.greenStock()), 7_500, "the green stock after roasting");
        assertEq(Grams.unwrap(shop.roastedStock()), 2_100, "the roasted stock after roasting");
    }

    function test_roasting_the_whole_stock() public {
        shop.roast(Grams.wrap(10_000));
        assertEq(Grams.unwrap(shop.greenStock()), 0, "the green stock after roasting all of it");
        assertEq(Grams.unwrap(shop.roastedStock()), 8_400, "the roasted stock after roasting all of it");
    }

    function test_not_enough_green() public {
        vm.expectRevert(
            abi.encodeWithSelector(Roastery.NotEnoughGreen.selector, Grams.wrap(10_000), Grams.wrap(10_001))
        );
        shop.roast(Grams.wrap(10_001));
        assertEq(Grams.unwrap(shop.greenStock()), 10_000, "the green stock after a refused roast");
    }

    function test_roast_for_an_order() public {
        vm.expectEmit(address(shop));
        emit Roasted(Grams.wrap(1_191), Grams.wrap(1_000));
        Grams out = shop.roastFor(Grams.wrap(1_000));
        assertEq(Grams.unwrap(out), 1_000, "the roasted weight for an order of 1,000 g");
        assertEq(Grams.unwrap(shop.greenStock()), 8_809, "the green stock after roasting for an order");
    }

    function test_roast_for_more_than_the_stock() public {
        vm.expectRevert(
            abi.encodeWithSelector(Roastery.NotEnoughGreen.selector, Grams.wrap(10_000), Grams.wrap(11_905))
        );
        shop.roastFor(Grams.wrap(10_000));
    }

    function test_only_the_roaster() public {
        address visitor = makeAddr("visitor");
        vm.prank(visitor);
        vm.expectRevert(abi.encodeWithSelector(Roastery.NotRoaster.selector, visitor));
        shop.roast(Grams.wrap(1));
        vm.prank(visitor);
        vm.expectRevert(abi.encodeWithSelector(Roastery.NotRoaster.selector, visitor));
        shop.roastFor(Grams.wrap(1));
    }

    function testFuzz_weight_only_goes_down(uint32 green) public {
        Grams amount = Grams.wrap(bound(green, 0, 10_000));
        Grams out = shop.roast(amount);
        assertFalse(amount < out, "roasted beans never weigh more than the green ones");
        assertEq(
            Grams.unwrap(shop.greenStock()) + Grams.unwrap(amount), 10_000, "green stock plus the roasted green weight"
        );
    }
}
