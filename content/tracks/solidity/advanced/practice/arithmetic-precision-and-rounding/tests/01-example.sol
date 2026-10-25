contract GranaryExampleTest is Test {
    event Redeemed(address indexed member, uint256 shares, uint256 assets);

    Granary granary;
    address alice = makeAddr("alice");
    address mallory = makeAddr("mallory");

    function setUp() public {
        granary = new Granary();
        hoax(alice, 10 ether);
        granary.deposit{value: 4 ether}();
    }

    function test_example() public {
        assertEq(granary.sharesOf(alice), 4 ether, "alice's shares after a 4 ether deposit");

        vm.expectEmit(address(granary));
        emit Redeemed(alice, 1 ether, 1 ether);
        vm.prank(alice);
        uint256 assets = granary.redeem(1 ether);
        assertEq(assets, 1 ether, "assets alice got for 1e18 shares");
        assertEq(address(granary).balance, 3 ether, "the fund after alice redeemed a quarter");
    }

    /// Attack test: a member redeems more shares than they hold. The fund must not pay it.
    function test_attack_redeem_more_than_you_hold() public {
        vm.prank(mallory);
        try granary.redeem(4 ether) {} catch {}

        assertEq(mallory.balance, 0, "ether a non-member drained by over-redeeming");
        assertEq(address(granary).balance, 4 ether, "alice's deposit still in the fund");
    }
}
