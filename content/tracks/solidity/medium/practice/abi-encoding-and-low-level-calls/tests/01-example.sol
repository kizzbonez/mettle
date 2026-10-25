contract TurntableExampleTest is Test {
    function test_example() public {
        TurntablePanel panel = new TurntablePanel();
        Turntable turntable = new Turntable(address(panel));

        bytes memory turn = panel.rotateCommand(90);
        assertEq(turn, abi.encodeWithSignature("rotate(uint16)", uint16(90)), "the calldata built by rotateCommand(90)");

        bytes memory result = panel.send(address(turntable), turn);
        assertEq(abi.decode(result, (uint16)), 90, "the heading returned through send");
        assertEq(panel.headingOf(address(turntable)), 90, "the heading read by headingOf");

        panel.send(address(turntable), abi.encodeCall(Turntable.openGate, ()));
        assertTrue(turntable.gateOpen(), "the gate after sending openGate");

        bytes memory steal = abi.encodeCall(Turntable.handOver, (address(this)));
        vm.expectRevert(abi.encodeWithSelector(TurntablePanel.ForbiddenCommand.selector, Turntable.handOver.selector));
        panel.send(address(turntable), steal);

        bytes memory tooFar = panel.rotateCommand(400);
        vm.expectRevert(abi.encodeWithSelector(Turntable.BadHeading.selector, uint16(400)));
        panel.send(address(turntable), tooFar);
    }
}
