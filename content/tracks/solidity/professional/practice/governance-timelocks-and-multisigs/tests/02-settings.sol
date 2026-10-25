import {IGovernor} from "@openzeppelin/contracts/governance/IGovernor.sol";

contract CouncilSettingsTest is Test {
    CivicToken token;
    TimelockController timelock;
    CouncilGovernor governor;
    CommunityFund fund;
    address treasurer = makeAddr("treasurer");
    address ada = makeAddr("ada");
    address cy = makeAddr("cy");

    function setUp() public {
        vm.warp(1_700_000_000);
        token = new CivicToken(treasurer);
        address[] memory none = new address[](0);
        timelock = new TimelockController(1 days, none, none, address(this));
        governor = new CouncilGovernor(token, timelock);
        timelock.grantRole(timelock.PROPOSER_ROLE(), address(governor));
        timelock.grantRole(timelock.EXECUTOR_ROLE(), address(0));
        fund = new CommunityFund(address(timelock), makeAddr("clerk"));

        vm.startPrank(treasurer);
        token.transfer(ada, 1_500e18);
        token.transfer(cy, 5e18);
        vm.stopPrank();
        vm.prank(ada);
        token.delegate(ada);
        vm.prank(cy);
        token.delegate(cy);
        vm.warp(block.timestamp + 1);
    }

    function _proposal() internal view returns (address[] memory t, uint256[] memory v, bytes[] memory c) {
        t = new address[](1);
        v = new uint256[](1);
        c = new bytes[](1);
        t[0] = address(fund);
        c[0] = abi.encodeCall(CommunityFund.grant, (cy, 1 ether));
    }

    function test_the_clock_counts_seconds() public {
        vm.warp(1_800_000_000);
        assertEq(token.CLOCK_MODE(), "mode=timestamp", "the token's CLOCK_MODE");
        assertEq(uint256(token.clock()), block.timestamp, "the token's clock");
        assertEq(governor.CLOCK_MODE(), "mode=timestamp", "the governor's CLOCK_MODE");
        assertEq(uint256(governor.clock()), block.timestamp, "the governor's clock");
    }

    function test_voting_delay_and_period() public view {
        assertEq(governor.votingDelay(), 2 days, "the voting delay");
        assertEq(governor.votingPeriod(), 5 days, "the voting period");
    }

    function test_quorum_is_ten_percent_of_the_supply() public view {
        assertEq(governor.quorum(block.timestamp - 1), 1_000e18, "the quorum at a past timepoint");
    }

    function test_small_holders_cannot_propose() public {
        assertEq(governor.proposalThreshold(), 10e18, "the proposal threshold");
        (address[] memory t, uint256[] memory v, bytes[] memory c) = _proposal();
        vm.prank(cy);
        vm.expectRevert(abi.encodeWithSelector(IGovernor.GovernorInsufficientProposerVotes.selector, cy, 5e18, 10e18));
        governor.propose(t, v, c, "Buy Cy a new bicycle");
    }

    function test_holders_above_the_threshold_can_propose() public {
        (address[] memory t, uint256[] memory v, bytes[] memory c) = _proposal();
        vm.prank(ada);
        uint256 id = governor.propose(t, v, c, "Grant 1 ether to the reading room");
        assertEq(governor.proposalSnapshot(id), block.timestamp + 2 days, "the snapshot of a new proposal");
    }
}
