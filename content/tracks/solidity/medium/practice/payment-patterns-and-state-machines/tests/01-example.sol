contract MuralExampleTest is Test {
    event StageChanged(MuralPot.Stage from, MuralPot.Stage to);

    function test_example() public {
        address lead = makeAddr("lead");
        address bo = makeAddr("bo");
        address cy = makeAddr("cy");
        address[] memory painters = new address[](3);
        painters[0] = lead;
        painters[1] = bo;
        painters[2] = cy;
        uint256 deadline = block.timestamp + 30 days;
        MuralPot pot = new MuralPot(painters, 1 ether, deadline);

        hoax(makeAddr("ana"), 1 ether);
        pot.pledge{value: 0.4 ether}();
        hoax(makeAddr("ben"), 1 ether);
        pot.pledge{value: 0.35 ether}();
        hoax(makeAddr("dee"), 1 ether);
        pot.pledge{value: 0.25 ether + 1}();
        assertEq(pot.totalPledged(), 1 ether + 1, "the total pledged");

        vm.warp(deadline);
        vm.expectEmit(address(pot));
        emit StageChanged(MuralPot.Stage.Pledging, MuralPot.Stage.Funded);
        pot.finish();
        assertEq(uint8(pot.stage()), uint8(MuralPot.Stage.Funded), "the stage after finish");

        console.log("lead owed:", pot.owed(lead));
        console.log("bo owed:  ", pot.owed(bo));
        console.log("cy owed:  ", pot.owed(cy));
        assertEq(pot.owed(lead), 333333333333333335, "the lead painter's share, with the remainder");
        assertEq(pot.owed(bo), 333333333333333333, "a painter's share");

        vm.prank(lead);
        pot.withdraw();
        vm.prank(bo);
        pot.withdraw();
        vm.prank(cy);
        pot.withdraw();
        assertEq(lead.balance, 333333333333333335, "the lead painter's balance after withdrawing");
        assertEq(address(pot).balance, 0, "the ether left in the pot");
    }
}
