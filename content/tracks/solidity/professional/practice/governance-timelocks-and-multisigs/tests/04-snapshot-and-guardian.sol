contract CouncilSnapshotGuardianTest is Test {
    event PauseChanged(bool paused);

    CivicToken token;
    TimelockController timelock;
    CouncilGovernor governor;
    CommunityFund fund;
    address treasurer = makeAddr("treasurer");
    address clerk = makeAddr("clerk");
    address ada = makeAddr("ada");
    address mallory = makeAddr("mallory");

    function setUp() public {
        vm.warp(1_700_000_000);
        token = new CivicToken(treasurer);
        address[] memory none = new address[](0);
        timelock = new TimelockController(1 days, none, none, address(this));
        governor = new CouncilGovernor(token, timelock);
        timelock.grantRole(timelock.PROPOSER_ROLE(), address(governor));
        timelock.grantRole(timelock.EXECUTOR_ROLE(), address(0));
        timelock.renounceRole(timelock.DEFAULT_ADMIN_ROLE(), address(this));
        fund = new CommunityFund(address(timelock), clerk);
        vm.deal(address(fund), 10 ether);

        vm.prank(treasurer);
        token.transfer(ada, 1_500e18);
        vm.prank(ada);
        token.delegate(ada);
        vm.warp(block.timestamp + 1);
    }

    function test_votes_need_delegation() public view {
        assertEq(token.balanceOf(treasurer), 8_500e18, "the treasurer's balance");
        assertEq(token.getVotes(treasurer), 0, "votes of a holder who never delegated");
        assertEq(token.getVotes(ada), 1_500e18, "votes of a holder who delegated to herself");
    }

    function test_tokens_received_after_the_snapshot_weigh_nothing() public {
        address[] memory t = new address[](1);
        uint256[] memory v = new uint256[](1);
        bytes[] memory c = new bytes[](1);
        t[0] = address(fund);
        c[0] = abi.encodeCall(CommunityFund.grant, (ada, 1 ether));
        vm.prank(ada);
        uint256 id = governor.propose(t, v, c, "Fix the footbridge");
        vm.warp(block.timestamp + 2 days + 1);

        // Voting is open: Mallory borrows most of the supply and votes against.
        vm.prank(treasurer);
        token.transfer(mallory, 8_500e18);
        vm.startPrank(mallory);
        token.delegate(mallory);
        uint256 weight = governor.castVote(id, 0);
        vm.stopPrank();
        assertEq(weight, 0, "the weight of votes received after the snapshot");

        vm.prank(ada);
        governor.castVote(id, 1);
        vm.warp(block.timestamp + 5 days);
        assertEq(uint8(governor.state(id)), 4, "state after a late, borrowed vote against (Succeeded)");
    }

    function test_the_guardian_pauses_and_only_the_timelock_unpauses() public {
        vm.expectEmit(address(fund));
        emit PauseChanged(true);
        vm.prank(clerk);
        fund.pause();
        assertTrue(fund.paused(), "paused after the guardian's pause");

        vm.prank(address(timelock));
        vm.expectRevert(CommunityFund.FundPaused.selector);
        fund.grant(ada, 1 ether);

        vm.prank(clerk);
        vm.expectRevert(abi.encodeWithSelector(CommunityFund.NotTimelock.selector, clerk));
        fund.unpause();

        vm.expectEmit(address(fund));
        emit PauseChanged(false);
        vm.prank(address(timelock));
        fund.unpause();

        vm.prank(address(timelock));
        fund.grant(ada, 1 ether);
        assertEq(ada.balance, 1 ether, "a grant paid after the pause was lifted");
    }

    function test_only_the_guardian_pauses() public {
        vm.prank(mallory);
        vm.expectRevert(abi.encodeWithSelector(CommunityFund.NotGuardian.selector, mallory));
        fund.pause();

        vm.prank(address(timelock));
        vm.expectRevert(abi.encodeWithSelector(CommunityFund.NotGuardian.selector, address(timelock)));
        fund.pause();
        assertFalse(fund.paused(), "paused after refused pauses");
    }

    function test_the_guardian_cannot_spend() public {
        vm.prank(clerk);
        vm.expectRevert(abi.encodeWithSelector(CommunityFund.NotTimelock.selector, clerk));
        fund.grant(clerk, 1 ether);
    }
}
