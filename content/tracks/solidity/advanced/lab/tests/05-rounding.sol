contract RoundingTest is Test {
    address treasurer = makeAddr("treasurer");
    address alice = makeAddr("alice");
    address stranger = makeAddr("stranger");
    SavingsPool pool;

    function setUp() public {
        pool = new SavingsPool(treasurer);
        vm.deal(alice, 3 ether);
        vm.prank(alice);
        pool.deposit{value: 3 ether}();
        vm.deal(treasurer, 1.5 ether);
        vm.prank(treasurer);
        pool.addInterest{value: 1.5 ether}(); // a share is now worth 1.5 wei
    }

    function test_no_shares_means_no_ether() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(SavingsPool.InsufficientShares.selector, 0, 1));
        pool.withdraw(1);
    }

    function test_dust_withdrawals_cannot_drain_the_pool() public {
        vm.startPrank(stranger);
        for (uint256 i = 0; i < 200; i++) {
            try pool.withdraw(1) {} catch {}
        }
        vm.stopPrank();
        assertEq(stranger.balance, 0, "the ether a member without shares withdrew in tiny amounts");
        assertEq(pool.totalAssets(), 4.5 ether, "the pool's assets after the tiny withdrawals");
    }

    function testFuzz_a_withdrawal_never_lowers_the_share_price(uint256 assets) public {
        assets = bound(assets, 1, 4.5 ether);
        (uint256 oldAssets, uint256 oldShares) = (pool.totalAssets(), pool.totalShares());
        vm.prank(alice);
        pool.withdraw(assets);
        (uint256 newAssets, uint256 newShares) = (pool.totalAssets(), pool.totalShares());
        assertGe(newAssets * oldShares, oldAssets * newShares, "the value of a share after a withdrawal");
    }

    function test_a_one_wei_withdrawal_burns_a_whole_share() public {
        vm.prank(alice);
        assertEq(pool.withdraw(1), 1, "the shares burned for a 1 wei withdrawal");
        vm.prank(alice);
        assertEq(pool.withdraw(1.5 ether), 1 ether, "the shares burned for a 1.5 ether withdrawal");
    }

    function test_deposits_round_down() public {
        vm.deal(stranger, 1 ether);
        vm.startPrank(stranger);
        vm.expectRevert(SavingsPool.ZeroShares.selector);
        pool.deposit{value: 1}();
        assertEq(pool.deposit{value: 3}(), 2, "the shares issued for a 3 wei deposit");
        vm.stopPrank();
    }
}
