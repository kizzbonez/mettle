contract OverRedeemTest is Test {
    Granary granary;
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address mallory = makeAddr("mallory");

    function setUp() public {
        granary = new Granary();
        hoax(alice, 100 ether);
        granary.deposit{value: 100 ether}();
    }

    function test_attack_drain_by_over_redeeming() public {
        // mallory holds no shares; redeeming the whole supply must not pay him.
        vm.prank(mallory);
        try granary.redeem(granary.totalShares()) {} catch {}
        assertEq(mallory.balance, 0, "ether a non-member took by redeeming the whole supply");
        assertEq(address(granary).balance, 100 ether, "the fund after the drain attempt");
    }

    function test_attack_small_holder_over_redeems() public {
        hoax(bob, 1 ether);
        granary.deposit{value: 1 ether}();
        uint256 bobShares = granary.sharesOf(bob);
        vm.prank(bob);
        try granary.redeem(bobShares + 1 ether) {} catch {}

        assertLe(bob.balance, 1 ether, "ether bob took by redeeming more than he holds");
        assertGe(address(granary).balance, 100 ether, "alice's deposit is still fully backed");
    }

    function test_over_redeem_reverts_with_the_custom_error() public {
        vm.prank(mallory);
        vm.expectRevert(abi.encodeWithSelector(Granary.InsufficientShares.selector, 0, uint256(1)));
        granary.redeem(1);
    }
}
