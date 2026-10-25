contract CouncilExampleTest is Test {
    event Granted(address indexed to, uint256 amount);

    CivicToken token;
    TimelockController timelock;
    CouncilGovernor governor;
    CommunityFund fund;
    address treasurer = makeAddr("treasurer");
    address clerk = makeAddr("clerk");
    address ada = makeAddr("ada");
    address ben = makeAddr("ben");
    address bellTower = makeAddr("bellTower");

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
        fund = new CommunityFund(address(timelock), clerk);
        vm.deal(address(fund), 10 ether);

        vm.startPrank(treasurer);
        token.transfer(ada, 1_500e18);
        token.transfer(ben, 600e18);
        vm.stopPrank();
        vm.prank(ada);
        token.delegate(ada);
        vm.prank(ben);
        token.delegate(ben);
        vm.warp(block.timestamp + 1);
    }

    function test_example() public {
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        targets[0] = address(fund);
        calldatas[0] = abi.encodeCall(CommunityFund.grant, (bellTower, 2 ether));
        string memory description = "Grant 2 ether to repair the bell tower";

        vm.prank(ada);
        uint256 id = governor.propose(targets, values, calldatas, description);
        assertEq(uint8(governor.state(id)), 0, "state right after propose (Pending)");

        vm.warp(block.timestamp + 2 days + 1);
        assertEq(uint8(governor.state(id)), 1, "state after the voting delay (Active)");
        vm.prank(ada);
        governor.castVote(id, 1);
        vm.prank(ben);
        governor.castVote(id, 0);

        vm.warp(block.timestamp + 5 days);
        assertEq(uint8(governor.state(id)), 4, "state after the voting period (Succeeded)");

        bytes32 descriptionHash = keccak256(bytes(description));
        governor.queue(targets, values, calldatas, descriptionHash);
        assertEq(uint8(governor.state(id)), 5, "state after queue (Queued)");

        vm.warp(block.timestamp + 1 days);
        vm.expectEmit(address(fund));
        emit Granted(bellTower, 2 ether);
        governor.execute(targets, values, calldatas, descriptionHash);
        assertEq(bellTower.balance, 2 ether, "the bell tower's grant");
        assertEq(uint8(governor.state(id)), 7, "state after execute (Executed)");
    }
}
