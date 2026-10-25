contract CouncilTimelockTest is Test {
    CivicToken token;
    TimelockController timelock;
    CouncilGovernor governor;
    CommunityFund fund;
    address treasurer = makeAddr("treasurer");
    address ada = makeAddr("ada");
    address ben = makeAddr("ben");
    address dee = makeAddr("dee");
    address reading = makeAddr("readingRoom");

    function setUp() public {
        vm.warp(1_700_000_000);
        token = new CivicToken(treasurer);
        address[] memory none = new address[](0);
        timelock = new TimelockController(1 days, none, none, address(this));
        governor = new CouncilGovernor(token, timelock);
        timelock.grantRole(timelock.PROPOSER_ROLE(), address(governor));
        timelock.grantRole(timelock.CANCELLER_ROLE(), address(governor));
        timelock.grantRole(timelock.EXECUTOR_ROLE(), address(0));
        timelock.renounceRole(timelock.DEFAULT_ADMIN_ROLE(), address(this));
        fund = new CommunityFund(address(timelock), makeAddr("clerk"));
        vm.deal(address(fund), 10 ether);

        vm.startPrank(treasurer);
        token.transfer(ada, 1_500e18);
        token.transfer(ben, 600e18);
        token.transfer(dee, 400e18);
        vm.stopPrank();
        vm.prank(ada);
        token.delegate(ada);
        vm.prank(ben);
        token.delegate(ben);
        vm.prank(dee);
        token.delegate(dee);
        vm.warp(block.timestamp + 1);
    }

    function _proposal(uint256 amount)
        internal
        view
        returns (address[] memory t, uint256[] memory v, bytes[] memory c)
    {
        t = new address[](1);
        v = new uint256[](1);
        c = new bytes[](1);
        t[0] = address(fund);
        c[0] = abi.encodeCall(CommunityFund.grant, (reading, amount));
    }

    function test_passed_proposals_wait_in_the_timelock() public {
        (address[] memory t, uint256[] memory v, bytes[] memory c) = _proposal(1 ether);
        bytes32 descriptionHash = keccak256(bytes("Lamps for the reading room"));
        vm.prank(ada);
        uint256 id = governor.propose(t, v, c, "Lamps for the reading room");
        vm.warp(block.timestamp + 2 days + 1);
        vm.prank(ada);
        governor.castVote(id, 1);
        vm.warp(block.timestamp + 5 days);
        assertTrue(governor.proposalNeedsQueuing(id), "a passed proposal must be queued in the timelock");
        governor.queue(t, v, c, descriptionHash);

        vm.expectPartialRevert(TimelockController.TimelockUnexpectedOperationState.selector);
        governor.execute(t, v, c, descriptionHash);
        assertEq(reading.balance, 0, "a grant executed before the timelock delay");

        vm.warp(block.timestamp + 1 days);
        governor.execute(t, v, c, descriptionHash);
        assertEq(reading.balance, 1 ether, "the grant after the timelock delay");
    }

    function test_below_quorum_is_defeated() public {
        (address[] memory t, uint256[] memory v, bytes[] memory c) = _proposal(1 ether);
        vm.prank(ada);
        uint256 id = governor.propose(t, v, c, "Paint the bus shelter");
        vm.warp(block.timestamp + 2 days + 1);
        vm.prank(ben);
        governor.castVote(id, 1); // 600 for: 6% of the supply
        vm.warp(block.timestamp + 5 days);
        assertEq(uint8(governor.state(id)), 3, "state of a proposal with 6% for votes (Defeated)");
    }

    function test_abstain_votes_count_towards_quorum() public {
        (address[] memory t, uint256[] memory v, bytes[] memory c) = _proposal(1 ether);
        vm.prank(ada);
        uint256 id = governor.propose(t, v, c, "New benches on the green");
        vm.warp(block.timestamp + 2 days + 1);
        vm.prank(ben);
        governor.castVote(id, 1); // 600 for
        vm.prank(dee);
        governor.castVote(id, 2); // 400 abstain: together exactly 10%
        vm.warp(block.timestamp + 5 days);
        assertEq(uint8(governor.state(id)), 4, "state with for and abstain votes at exactly the quorum (Succeeded)");
    }

    function test_the_fund_pays_only_the_timelock() public {
        vm.prank(address(governor));
        vm.expectRevert(abi.encodeWithSelector(CommunityFund.NotTimelock.selector, address(governor)));
        fund.grant(ada, 1 ether);

        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(CommunityFund.NotTimelock.selector, ada));
        fund.grant(ada, 1 ether);
        assertEq(address(fund).balance, 10 ether, "the fund after refused grants");
    }

    function test_a_refused_payment_reverts_the_grant() public {
        CouncilRefusingRecipient refuser = new CouncilRefusingRecipient();
        vm.prank(address(timelock));
        vm.expectRevert(CommunityFund.GrantFailed.selector);
        fund.grant(address(refuser), 1 ether);
    }
}

contract CouncilRefusingRecipient {
    receive() external payable {
        revert("no thanks");
    }
}
