contract KelpAllowanceTest is Test {
    event Approval(address indexed owner, address indexed spender, uint256 value);

    KelpShare share;
    address fern = makeAddr("fern");
    address broker = makeAddr("broker");
    address gil = makeAddr("gil");

    function setUp() public {
        share = new KelpShare();
        share.mint(fern, 1_000);
    }

    function test_approve_replaces_and_announces() public {
        vm.startPrank(fern);
        vm.expectEmit(address(share));
        emit Approval(fern, broker, 300);
        bool ok = share.approve(broker, 300);
        share.approve(broker, 50);
        vm.stopPrank();
        assertTrue(ok, "approve returns true");
        assertEq(share.allowance(fern, broker), 50, "the allowance after approving 300, then 50");
    }

    function test_approving_nobody_is_refused() public {
        vm.expectRevert(abi.encodeWithSelector(IERC20Errors.ERC20InvalidSpender.selector, address(0)));
        vm.prank(fern);
        share.approve(address(0), 10);
    }

    function test_transfer_from_spends_the_allowance() public {
        vm.prank(fern);
        share.approve(broker, 400);
        vm.prank(broker);
        bool ok = share.transferFrom(fern, gil, 400);
        assertTrue(ok, "transferFrom returns true");
        assertEq(share.allowance(fern, broker), 0, "the allowance after spending all of it");
        assertEq(share.balanceOf(fern), 600, "fern's balance after the broker's transfer");
        assertEq(share.balanceOf(gil), 400, "gil's balance after the broker's transfer");
        assertEq(share.balanceOf(broker), 0, "the broker keeps nothing for itself");
    }

    function test_no_allowance_no_transfer() public {
        vm.expectRevert(abi.encodeWithSelector(IERC20Errors.ERC20InsufficientAllowance.selector, broker, 0, 1));
        vm.prank(broker);
        share.transferFrom(fern, broker, 1);
    }

    function test_the_allowance_is_checked_before_the_balance() public {
        vm.prank(fern);
        share.approve(broker, 5);
        vm.expectRevert(abi.encodeWithSelector(IERC20Errors.ERC20InsufficientAllowance.selector, broker, 5, 2_000));
        vm.prank(broker);
        share.transferFrom(fern, gil, 2_000);
    }

    function test_the_balance_still_limits_a_large_allowance() public {
        vm.prank(fern);
        share.approve(broker, 5_000);
        vm.expectRevert(abi.encodeWithSelector(IERC20Errors.ERC20InsufficientBalance.selector, fern, 1_000, 1_001));
        vm.prank(broker);
        share.transferFrom(fern, gil, 1_001);
        assertEq(share.allowance(fern, broker), 5_000, "the allowance after a refused transfer");
    }

    function test_an_unlimited_allowance_stays_unlimited() public {
        vm.prank(fern);
        share.approve(broker, type(uint256).max);
        vm.prank(broker);
        share.transferFrom(fern, gil, 250);
        assertEq(share.allowance(fern, broker), type(uint256).max, "an unlimited allowance after spending");
        assertEq(share.balanceOf(gil), 250, "gil's balance after a transfer under an unlimited allowance");
    }

    function test_transfer_from_emits_only_transfer() public {
        vm.prank(fern);
        share.approve(broker, 100);
        vm.recordLogs();
        vm.prank(broker);
        share.transferFrom(fern, gil, 60);
        Vm.Log[] memory entries = vm.getRecordedLogs();
        assertEq(entries.length, 1, "the number of events transferFrom emits");
        assertEq(entries[0].topics[0], keccak256("Transfer(address,address,uint256)"), "the event transferFrom emits");
    }

    function testFuzz_spending_part_of_an_allowance(uint256 approved, uint256 spent) public {
        approved = bound(approved, 0, type(uint256).max - 1);
        spent = bound(spent, 0, approved < 1_000 ? approved : 1_000);
        vm.prank(fern);
        share.approve(broker, approved);
        vm.prank(broker);
        share.transferFrom(fern, gil, spent);
        assertEq(share.allowance(fern, broker), approved - spent, "the allowance left after spending part of it");
    }
}
