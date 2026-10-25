contract KelpExampleTest is Test {
    function test_example() public {
        address ana = makeAddr("ana");
        address ben = makeAddr("ben");
        address cal = makeAddr("cal");
        address market = makeAddr("market");

        KelpShare share = new KelpShare();
        share.mint(ana, 1_000);
        assertEq(share.totalSupply(), 1_000, "the supply after minting");

        vm.prank(ana);
        share.transfer(ben, 250);
        assertEq(share.balanceOf(ana), 750, "ana's balance after her transfer");
        assertEq(share.balanceOf(ben), 250, "ben's balance after ana's transfer");

        vm.prank(ana);
        share.approve(market, 300);
        vm.prank(market);
        share.transferFrom(ana, cal, 200);
        assertEq(share.allowance(ana, market), 100, "the market's allowance after spending 200");
        assertEq(share.balanceOf(cal), 200, "cal's balance after the market's transfer");

        vm.expectRevert(abi.encodeWithSelector(IERC20Errors.ERC20InsufficientAllowance.selector, market, 100, 101));
        vm.prank(market);
        share.transferFrom(ana, cal, 101);

        vm.expectRevert(abi.encodeWithSelector(IERC20Errors.ERC20InsufficientBalance.selector, ben, 250, 251));
        vm.prank(ben);
        share.transfer(cal, 251);

        vm.prank(ben);
        share.transfer(ben, 250);
        assertEq(share.balanceOf(ben), 250, "ben's balance after a transfer to himself");
    }
}
