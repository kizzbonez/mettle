contract MuralStagesTest is Test {
    event StageChanged(MuralPot.Stage from, MuralPot.Stage to);

    MuralPot pot;
    uint256 deadline;
    address backer = makeAddr("backer");
    address lead = makeAddr("lead");

    function setUp() public {
        address[] memory painters = new address[](2);
        painters[0] = lead;
        painters[1] = makeAddr("second");
        deadline = block.timestamp + 10 days;
        pot = new MuralPot(painters, 2 ether, deadline);
        vm.deal(backer, 10 ether);
    }

    function _wrongStage(MuralPot.Stage expected, MuralPot.Stage actual) internal pure returns (bytes memory) {
        return abi.encodeWithSelector(MuralPot.WrongStage.selector, expected, actual);
    }

    function test_pledges_are_open_until_the_second_before_the_deadline() public {
        vm.warp(deadline - 1);
        vm.prank(backer);
        pot.pledge{value: 1 ether}();
        assertEq(pot.pledged(backer), 1 ether, "the backer's pledge just before the deadline");
    }

    function test_pledging_closes_at_the_deadline() public {
        vm.prank(backer);
        pot.pledge{value: 1 ether}();
        vm.warp(deadline);
        vm.prank(backer);
        vm.expectRevert(_wrongStage(MuralPot.Stage.Pledging, MuralPot.Stage.Failed));
        pot.pledge{value: 1 ether}();
        assertEq(uint8(pot.stage()), uint8(MuralPot.Stage.Pledging), "the stored stage after a refused pledge");
    }

    function test_rejects_a_zero_pledge() public {
        vm.prank(backer);
        vm.expectRevert(MuralPot.ZeroPledge.selector);
        pot.pledge();
    }

    function test_finish_waits_for_the_deadline() public {
        vm.warp(deadline - 1);
        vm.expectRevert(abi.encodeWithSelector(MuralPot.TooEarly.selector, deadline));
        pot.finish();
    }

    function test_reaching_exactly_the_goal_funds_the_mural() public {
        vm.prank(backer);
        pot.pledge{value: 2 ether}();
        vm.warp(deadline);
        vm.expectEmit(address(pot));
        emit StageChanged(MuralPot.Stage.Pledging, MuralPot.Stage.Funded);
        pot.finish();
        assertEq(uint8(pot.stage()), uint8(MuralPot.Stage.Funded), "the stage when the goal is met exactly");
    }

    function test_missing_the_goal_fails_the_pot() public {
        vm.prank(backer);
        pot.pledge{value: 2 ether - 1}();
        vm.warp(deadline + 1 days);
        vm.expectEmit(address(pot));
        emit StageChanged(MuralPot.Stage.Pledging, MuralPot.Stage.Failed);
        pot.finish();
        assertEq(uint8(pot.stage()), uint8(MuralPot.Stage.Failed), "the stage one wei short of the goal");
    }

    function test_refunds_only_in_a_failed_pot() public {
        vm.prank(backer);
        pot.pledge{value: 2 ether}();
        vm.prank(backer);
        vm.expectRevert(_wrongStage(MuralPot.Stage.Failed, MuralPot.Stage.Pledging));
        pot.refund();

        vm.warp(deadline);
        vm.prank(backer);
        vm.expectRevert(_wrongStage(MuralPot.Stage.Failed, MuralPot.Stage.Funded));
        pot.refund();
    }

    function test_withdrawals_only_in_a_funded_pot() public {
        vm.prank(backer);
        pot.pledge{value: 1 ether}();
        vm.prank(lead);
        vm.expectRevert(_wrongStage(MuralPot.Stage.Funded, MuralPot.Stage.Pledging));
        pot.withdraw();

        vm.warp(deadline);
        vm.prank(lead);
        vm.expectRevert(_wrongStage(MuralPot.Stage.Funded, MuralPot.Stage.Failed));
        pot.withdraw();
    }

    function test_the_first_call_after_the_deadline_moves_the_stage() public {
        vm.prank(backer);
        pot.pledge{value: 1 ether}();
        vm.warp(deadline);
        vm.prank(backer);
        pot.refund();
        assertEq(uint8(pot.stage()), uint8(MuralPot.Stage.Failed), "the stage after a refund moved it");
        assertEq(backer.balance, 10 ether, "the backer's balance after the refund");
    }
}
