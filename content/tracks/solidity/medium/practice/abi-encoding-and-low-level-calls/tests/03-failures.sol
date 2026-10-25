/// A turntable whose motor is broken: rotate fails with a revert string.
contract JammedTurntable {
    function rotate(uint16) external pure returns (uint16) {
        revert("motor jammed");
    }
}

contract FailuresTest is Test {
    TurntablePanel panel;
    Turntable turntable;

    function setUp() public {
        panel = new TurntablePanel();
        turntable = new Turntable(address(panel));
    }

    function test_bubbles_the_turntables_custom_error() public {
        bytes memory command = panel.rotateCommand(360);
        vm.expectRevert(abi.encodeWithSelector(Turntable.BadHeading.selector, uint16(360)));
        panel.send(address(turntable), command);
    }

    function test_bubbles_not_panel_from_a_turntable_it_does_not_control() public {
        Turntable other = new Turntable(address(0x07E));
        bytes memory command = panel.rotateCommand(10);
        vm.expectRevert(abi.encodeWithSelector(Turntable.NotPanel.selector, address(panel)));
        panel.send(address(other), command);
    }

    function test_bubbles_a_revert_string() public {
        JammedTurntable jammed = new JammedTurntable();
        bytes memory command = panel.rotateCommand(10);
        vm.expectRevert(bytes("motor jammed"));
        panel.send(address(jammed), command);
    }

    function test_refuses_an_address_without_code() public {
        bytes memory command = panel.rotateCommand(10);
        vm.expectRevert(abi.encodeWithSelector(TurntablePanel.NoCode.selector, address(0xD0E)));
        panel.send(address(0xD0E), command);
    }

    function test_returns_the_turntables_return_data() public {
        bytes memory turned = panel.send(address(turntable), panel.rotateCommand(45));
        assertEq(turned, abi.encode(uint16(45)), "the bytes send returns for rotate(45)");
        bytes memory opened = panel.send(address(turntable), abi.encodeCall(Turntable.openGate, ()));
        assertEq(opened.length, 0, "the length of what send returns for openGate");
        assertEq(turntable.heading(), 45, "the turntable's heading after rotate(45)");
    }
}
