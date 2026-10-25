contract KelpMintTransferTest is Test {
    event Transfer(address indexed from, address indexed to, uint256 value);

    KelpShare share;
    address dora = makeAddr("dora");
    address eamon = makeAddr("eamon");

    function setUp() public {
        share = new KelpShare();
    }

    function test_the_secretary_mints() public {
        vm.expectEmit(address(share));
        emit Transfer(address(0), dora, 500);
        share.mint(dora, 500);
        share.mint(eamon, 120);
        share.mint(dora, 30);
        assertEq(share.balanceOf(dora), 530, "dora's balance after two mints");
        assertEq(share.totalSupply(), 650, "the supply after three mints");
    }

    function test_nobody_else_mints() public {
        vm.expectRevert(abi.encodeWithSelector(KelpShare.NotSecretary.selector, dora));
        vm.prank(dora);
        share.mint(dora, 1_000_000);
        assertEq(share.totalSupply(), 0, "the supply after a refused mint");
    }

    function test_minting_to_nobody_is_refused() public {
        vm.expectRevert(abi.encodeWithSelector(IERC20Errors.ERC20InvalidReceiver.selector, address(0)));
        share.mint(address(0), 10);
    }

    function test_transfer_moves_and_announces() public {
        share.mint(dora, 400);
        vm.expectEmit(address(share));
        emit Transfer(dora, eamon, 150);
        vm.prank(dora);
        bool ok = share.transfer(eamon, 150);
        assertTrue(ok, "transfer returns true");
        assertEq(share.balanceOf(dora), 250, "dora's balance after sending 150");
        assertEq(share.balanceOf(eamon), 150, "eamon's balance after receiving 150");
        assertEq(share.totalSupply(), 400, "the supply after a transfer");
    }

    function test_transfer_refuses_more_than_the_balance() public {
        share.mint(dora, 99);
        vm.expectRevert(abi.encodeWithSelector(IERC20Errors.ERC20InsufficientBalance.selector, dora, 99, 100));
        vm.prank(dora);
        share.transfer(eamon, 100);
        assertEq(share.balanceOf(dora), 99, "dora's balance after a refused transfer");
    }

    function test_transfer_refuses_the_zero_address_first() public {
        vm.expectRevert(abi.encodeWithSelector(IERC20Errors.ERC20InvalidReceiver.selector, address(0)));
        vm.prank(dora);
        share.transfer(address(0), 5);
    }

    function test_a_zero_transfer_is_a_transfer() public {
        vm.expectEmit(address(share));
        emit Transfer(dora, eamon, 0);
        vm.prank(dora);
        share.transfer(eamon, 0);
    }

    function test_a_transfer_to_yourself_changes_nothing() public {
        share.mint(dora, 300);
        vm.prank(dora);
        share.transfer(dora, 120);
        assertEq(share.balanceOf(dora), 300, "dora's balance after sending 120 to herself");
        assertEq(share.totalSupply(), 300, "the supply after a transfer to yourself");
    }

    function testFuzz_transfers_keep_the_supply(uint256 minted, uint256 sent) public {
        minted = bound(minted, 0, type(uint128).max);
        sent = bound(sent, 0, minted);
        share.mint(dora, minted);
        vm.prank(dora);
        share.transfer(eamon, sent);
        assertEq(share.balanceOf(dora), minted - sent, "the sender's balance after a transfer");
        assertEq(share.balanceOf(dora) + share.balanceOf(eamon), share.totalSupply(), "balances add up to the supply");
    }
}
