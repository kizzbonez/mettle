contract RoasteryExampleTest is Test {
    event Roasted(Grams green, Grams roasted);

    function test_example() public {
        Roastery shop = new Roastery(1_500);
        shop.receiveGreen(Grams.wrap(5_000));

        vm.expectEmit(address(shop));
        emit Roasted(Grams.wrap(1_000), Grams.wrap(850));
        Grams out = shop.roast(Grams.wrap(1_000));
        assertEq(Grams.unwrap(out), 850, "the roasted weight of 1,000 green grams");
        assertEq(Grams.unwrap(shop.greenStock()), 4_000, "the green stock after the first roast");
        assertEq(Grams.unwrap(shop.roastedStock()), 850, "the roasted stock after the first roast");

        out = shop.roastFor(Grams.wrap(500));
        assertEq(Grams.unwrap(out), 500, "the roasted weight of an order for 500 grams");
        assertEq(Grams.unwrap(shop.greenStock()), 3_411, "the green stock after roasting for 500 grams");
        assertEq(Grams.unwrap(shop.roastedStock()), 1_350, "the roasted stock after roasting for 500 grams");

        assertEq(Grams.unwrap(Roast.greenNeeded(Grams.wrap(5), 1_500)), 6, "the green weight needed for 5 grams");

        vm.expectRevert(abi.encodeWithSelector(Roastery.NotEnoughGreen.selector, Grams.wrap(3_411), Grams.wrap(9_000)));
        shop.roast(Grams.wrap(9_000));
    }
}
