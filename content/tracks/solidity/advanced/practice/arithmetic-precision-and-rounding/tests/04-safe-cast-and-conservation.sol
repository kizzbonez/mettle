contract SafeCastAndConservationTest is Test {
    Granary granary;
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address whale = makeAddr("whale");

    function setUp() public {
        granary = new Granary();
    }

    function test_a_deposit_too_large_for_the_ledger_reverts() public {
        // The share ledger is uint128; a first deposit mints one share per wei. A deposit above
        // the ledger's range must revert, not silently truncate the recorded shares.
        uint256 huge = uint256(type(uint128).max) + 77;
        vm.deal(whale, huge);
        vm.prank(whale);
        try granary.deposit{value: huge}() returns (uint256) {
            assertEq(granary.sharesOf(whale), huge, "shares recorded for an over-range deposit");
        } catch {}
        // Either way, the ledger must never claim more shares than the member really has.
        assertLe(uint256(granary.sharesOf(whale)), huge, "recorded shares never exceed the deposit");
        assertTrue(
            granary.sharesOf(whale) == 0 || uint256(granary.sharesOf(whale)) == huge,
            "an over-range deposit is all-or-nothing, never truncated"
        );
    }

    function test_two_members_share_the_fund() public {
        hoax(alice, 100 ether);
        granary.deposit{value: 6 ether}();
        hoax(bob, 100 ether);
        granary.deposit{value: 2 ether}();

        assertEq(granary.sharesOf(bob), 2 ether, "bob's shares for a 2 ether deposit into a 6 ether fund");
        uint256 aliceShares = granary.sharesOf(alice);
        uint256 bobShares = granary.sharesOf(bob);
        vm.prank(alice);
        granary.redeem(aliceShares);
        vm.prank(bob);
        granary.redeem(bobShares);
        assertEq(alice.balance, 100 ether, "alice's ether after depositing and redeeming");
        assertEq(bob.balance, 100 ether, "bob's ether after depositing and redeeming");
        assertEq(granary.totalShares(), 0, "shares after everyone redeemed");
    }

    function testFuzz_the_fund_never_pays_out_more_than_it_took(uint96 a, uint96 b, uint96 redeemA) public {
        a = uint96(bound(a, 1, 1_000 ether));
        b = uint96(bound(b, 1, 1_000 ether));
        hoax(alice, a);
        granary.deposit{value: a}();
        hoax(bob, b);
        uint256 bShares = granary.deposit{value: b}();

        uint256 aShares = granary.sharesOf(alice);
        redeemA = uint96(bound(redeemA, 0, aShares));
        if (redeemA > 0) {
            vm.prank(alice);
            granary.redeem(redeemA);
        }
        vm.prank(bob);
        granary.redeem(bShares);

        uint256 paidOut = alice.balance + bob.balance;
        assertLe(paidOut, uint256(a) + b, "total paid out against total deposited");
        assertEq(address(granary).balance, uint256(a) + b - paidOut, "the fund holds exactly what was not paid out");
    }
}
