contract PrecisionTest is Test {
    Granary granary;
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    function setUp() public {
        granary = new Granary();
        hoax(alice, 100 ether);
        granary.deposit{value: 3 ether}();
    }

    function test_a_minority_holder_redeems_a_fair_amount() public {
        hoax(bob, 100 ether);
        granary.deposit{value: 1 ether}(); // bob now holds 1e18 of 4e18 shares
        uint256 bobShares = granary.sharesOf(bob);

        vm.prank(bob);
        uint256 assets = granary.redeem(bobShares);
        assertEq(assets, 1 ether, "assets a one-quarter holder redeems");
        assertEq(bob.balance, 100 ether, "bob's ether after depositing then redeeming");
    }

    function testFuzz_redeeming_everything_returns_almost_everything(uint96 extra) public {
        extra = uint96(bound(extra, 1, 50 ether));
        hoax(bob, uint256(extra) + 1);
        granary.deposit{value: extra}();
        uint256 bobShares = granary.sharesOf(bob);

        vm.prank(bob);
        uint256 assets = granary.redeem(bobShares);
        // Floor rounding may keep a few wei of dust, never more than totalShares.
        assertLe(assets, extra, "a redeemer never gets more than they put in");
        assertGe(assets + 1e12, extra, "a redeemer gets back almost all of a fresh deposit");
    }

    function test_redeem_rounds_down_not_up() public {
        // Make the price non-integer: 3e18 shares back 3 ether + 2 wei donated as a deposit.
        hoax(bob, 100 ether);
        granary.deposit{value: 2 ether}(); // totalShares 5e18, balance 5 ether
        vm.deal(address(granary), address(granary).balance + 1); // an odd wei
        uint256 bobShares = granary.sharesOf(bob);

        vm.prank(bob);
        uint256 assets = granary.redeem(bobShares);
        // Fair value is 2e18 * (5e18+1) / 5e18 = 2e18 + 0 (floor), never 2e18 + 1.
        assertLe(assets, 2 ether, "a redemption rounds in the fund's favour");
    }
}
