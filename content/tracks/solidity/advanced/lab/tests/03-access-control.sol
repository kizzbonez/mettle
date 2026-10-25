contract AccessControlTest is Test {
    event TreasurerChanged(address indexed previous, address indexed next);

    uint256 treasurerKey = uint256(keccak256("access treasurer"));
    address treasurer = vm.addr(treasurerKey);
    uint256 attackerKey = uint256(keccak256("access attacker"));
    address attacker = vm.addr(attackerKey);
    SavingsPool pool;
    BonusDesk desk;

    function setUp() public {
        pool = new SavingsPool(treasurer);
        desk = new BonusDesk(pool, treasurer);
        vm.deal(address(this), 5 ether);
        (bool ok,) = address(desk).call{value: 5 ether}("");
        require(ok, "funding the desk");
    }

    function signed(uint256 key, address member, uint256 amount, uint256 nonce) internal view returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(key, desk.bonusDigest(member, amount, nonce, 1 days));
        return abi.encodePacked(r, s, v);
    }

    function test_a_self_appointed_treasurer_cannot_drain_the_desk() public {
        vm.startPrank(attacker);
        try desk.setTreasurer(attacker) {} catch {}
        bytes memory forged = signed(attackerKey, attacker, 5 ether, 0);
        try desk.claim(attacker, 5 ether, 0, 1 days, forged) {} catch {}
        try pool.withdraw(5 ether) {} catch {}
        vm.stopPrank();
        assertEq(desk.treasurer(), treasurer, "the desk's treasurer after the attack");
        assertEq(address(desk).balance, 5 ether, "the ether left in the bonus desk after the attack");
        assertEq(attacker.balance, 0, "the ether the attacker took");
    }

    function test_strangers_cannot_appoint_treasurers() public {
        vm.startPrank(attacker);
        vm.expectRevert(abi.encodeWithSelector(Roles.NotOwner.selector, attacker));
        desk.setTreasurer(attacker);
        vm.expectRevert(abi.encodeWithSelector(Roles.NotOwner.selector, attacker));
        pool.setTreasurer(attacker);
        vm.stopPrank();
    }

    function test_the_board_appoints_a_new_treasurer() public {
        uint256 nextKey = uint256(keccak256("next treasurer"));
        address next = vm.addr(nextKey);
        vm.expectEmit(address(desk));
        emit TreasurerChanged(treasurer, next);
        desk.setTreasurer(next);

        address member = makeAddr("member");
        bytes memory stale = signed(treasurerKey, member, 1 ether, 0);
        vm.expectRevert(abi.encodeWithSelector(BonusDesk.WrongSigner.selector, treasurer));
        desk.claim(member, 1 ether, 0, 1 days, stale);
        desk.claim(member, 1 ether, 0, 1 days, signed(nextKey, member, 1 ether, 0));
        assertEq(pool.assetsOf(member), 1 ether, "the bonus paid on the new treasurer's voucher");
    }

    function test_only_the_treasurer_adds_interest() public {
        vm.deal(attacker, 1 ether);
        vm.prank(attacker);
        vm.expectRevert(abi.encodeWithSelector(Roles.NotTreasurer.selector, attacker));
        pool.addInterest{value: 1 ether}();
    }

    function test_only_the_board_hands_over_the_board() public {
        vm.prank(attacker);
        vm.expectRevert(abi.encodeWithSelector(Roles.NotOwner.selector, attacker));
        desk.transferOwnership(attacker);
    }
}
