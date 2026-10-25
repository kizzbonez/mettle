contract EncodingAndAllowlistTest is Test {
    TurntablePanel panel;
    Turntable turntable;

    function setUp() public {
        panel = new TurntablePanel();
        turntable = new Turntable(address(panel));
    }

    function testFuzz_rotate_command_is_rotate_calldata(uint16 degrees) public view {
        bytes memory built = panel.rotateCommand(degrees);
        assertEq(built, abi.encodeWithSignature("rotate(uint16)", degrees), "the calldata built by rotateCommand");
        assertEq(built.length, 36, "the length of rotate calldata");
    }

    function test_open_and_close_pass() public {
        panel.send(address(turntable), abi.encodeCall(Turntable.openGate, ()));
        assertTrue(turntable.gateOpen(), "the gate after openGate");
        panel.send(address(turntable), abi.encodeCall(Turntable.closeGate, ()));
        assertFalse(turntable.gateOpen(), "the gate after closeGate");
    }

    function test_hand_over_is_forbidden() public {
        bytes memory steal = abi.encodeCall(Turntable.handOver, (address(0xBAD)));
        vm.expectRevert(abi.encodeWithSelector(TurntablePanel.ForbiddenCommand.selector, Turntable.handOver.selector));
        panel.send(address(turntable), steal);
        assertEq(turntable.panel(), address(panel), "the turntable's panel after a forbidden hand-over");
    }

    function test_unknown_commands_are_forbidden() public {
        vm.expectRevert(abi.encodeWithSelector(TurntablePanel.ForbiddenCommand.selector, bytes4(0xdeadbeef)));
        panel.send(address(turntable), hex"deadbeef0000000000000000000000000000000000000000000000000000000000000001");
    }

    function test_short_commands_are_forbidden() public {
        vm.expectRevert(abi.encodeWithSelector(TurntablePanel.ForbiddenCommand.selector, bytes4(0x10030000)));
        panel.send(address(turntable), hex"1003");
        vm.expectRevert(abi.encodeWithSelector(TurntablePanel.ForbiddenCommand.selector, bytes4(0)));
        panel.send(address(turntable), "");
    }

    function test_strangers_cannot_send() public {
        bytes memory turn = panel.rotateCommand(10);
        vm.prank(address(0x5757));
        vm.expectRevert(abi.encodeWithSelector(TurntablePanel.NotOperator.selector, address(0x5757)));
        panel.send(address(turntable), turn);
    }

    function test_operator_is_checked_before_the_command() public {
        bytes memory steal = abi.encodeCall(Turntable.handOver, (address(0xBAD)));
        vm.prank(address(0x5757));
        vm.expectRevert(abi.encodeWithSelector(TurntablePanel.NotOperator.selector, address(0x5757)));
        panel.send(address(turntable), steal);
    }

    function test_an_added_operator_can_send() public {
        panel.addOperator(address(0x0B5));
        bytes memory turn = panel.rotateCommand(180);
        vm.prank(address(0x0B5));
        panel.send(address(turntable), turn);
        assertEq(turntable.heading(), 180, "the heading after an added operator's command");
    }
}
