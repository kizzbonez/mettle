contract WithdrawingTest is Test {
    event Withdrawn(address indexed member, uint256 amount);

    SavingsJar jar;
    address bo = address(0xB0);
    address cy = address(0xC1);

    function setUp() public {
        jar = new SavingsJar();
        vm.deal(bo, 3 ether);
        vm.deal(cy, 3 ether);
        vm.prank(bo);
        jar.save{value: 2 ether}();
        vm.prank(cy);
        jar.save{value: 1 ether}();
    }

    function test_withdraws_everything_saved() public {
        vm.expectEmit(address(jar));
        emit Withdrawn(bo, 2 ether);
        vm.prank(bo);
        jar.withdraw(2 ether);

        assertEq(bo.balance, 3 ether, "the member's ether after withdrawing all savings");
        assertEq(jar.savedBy(bo), 0, "savings after withdrawing all of them");
        assertEq(jar.totalSaved(), 1 ether, "total savings after one member withdrew");
        assertEq(jar.savedBy(cy), 1 ether, "the other member's savings are untouched");
    }

    function test_refuses_more_than_saved() public {
        vm.prank(cy);
        vm.expectRevert(abi.encodeWithSelector(SavingsJar.InsufficientSavings.selector, 1 ether, 1 ether + 1));
        jar.withdraw(1 ether + 1);

        vm.prank(address(0xBAD));
        vm.expectRevert(abi.encodeWithSelector(SavingsJar.InsufficientSavings.selector, 0, 1));
        jar.withdraw(1);
    }

    function test_refuses_a_zero_withdrawal() public {
        vm.prank(bo);
        vm.expectRevert(SavingsJar.ZeroAmount.selector);
        jar.withdraw(0);
    }

    function testFuzz_partial_withdrawals_add_up(uint256 first, uint256 second) public {
        first = bound(first, 1, 2 ether - 1);
        second = bound(second, 1, 2 ether - first);

        vm.prank(bo);
        jar.withdraw(first);
        vm.prank(bo);
        jar.withdraw(second);

        assertEq(jar.savedBy(bo), 2 ether - first - second, "savings left after two withdrawals");
        assertEq(bo.balance, 1 ether + first + second, "the member's ether after two withdrawals");
        assertEq(jar.totalSaved(), 3 ether - first - second, "total savings after two withdrawals");
        assertEq(address(jar).balance, jar.totalSaved(), "ether held equals total savings");
    }
}
