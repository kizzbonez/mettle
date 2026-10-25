/// Test helper: a member contract that accepts ether and does nothing else.
contract QuietMember {
    function join(CoopVault vault) external payable {
        vault.deposit{value: msg.value}();
    }

    function leave(CoopVault vault) external {
        vault.withdrawAll();
    }

    receive() external payable {}
}

/// Test helper: a member contract that cannot receive ether.
contract DeafMember {
    function join(CoopVault vault) external payable {
        vault.deposit{value: msg.value}();
    }

    function leave(CoopVault vault) external {
        vault.withdrawAll();
    }
}

contract PaymentsTest is Test {
    CoopVault vault;
    address ada = makeAddr("ada");
    address ben = makeAddr("ben");

    function setUp() public {
        vault = new CoopVault();
        vm.deal(address(this), 10 ether);
    }

    function test_pays_a_contract_member() public {
        QuietMember member = new QuietMember();
        member.join{value: 0.4 ether}(vault);
        member.leave(vault);
        assertEq(address(member).balance, 0.4 ether, "ether paid to a contract member");
        assertEq(vault.depositOf(address(member)), 0, "the member's deposit after withdrawing");
    }

    function test_nothing_to_withdraw() public {
        vm.prank(ada);
        vm.expectRevert(CoopVault.NothingToWithdraw.selector);
        vault.withdrawAll();

        hoax(ada, 1 ether);
        vault.deposit{value: 0.2 ether}();
        vm.prank(ada);
        vault.withdrawAll();
        vm.prank(ada);
        vm.expectRevert(CoopVault.NothingToWithdraw.selector);
        vault.withdrawAll();
    }

    function test_a_refused_payment_keeps_the_deposit() public {
        DeafMember member = new DeafMember();
        member.join{value: 0.3 ether}(vault);
        vm.expectRevert(CoopVault.PaymentFailed.selector);
        member.leave(vault);
        assertEq(vault.depositOf(address(member)), 0.3 ether, "the deposit after a refused payment");
    }

    function testFuzz_deposits_always_match_the_ether(uint96 adaIn, uint96 benIn, uint96 moved) public {
        hoax(ada, adaIn);
        vault.deposit{value: adaIn}();
        hoax(ben, benIn);
        vault.deposit{value: benIn}();
        moved = uint96(bound(moved, 0, adaIn));
        vm.prank(ada);
        vault.transferDeposit(ben, moved);
        if (benIn + uint256(moved) > 0) {
            vm.prank(ben);
            vault.withdrawAll();
        }

        assertEq(ben.balance, uint256(benIn) + moved, "ben's ether after withdrawing his deposit");
        assertEq(address(vault).balance, vault.depositOf(ada) + vault.depositOf(ben), "the vault's ether against its deposits");
    }
}
