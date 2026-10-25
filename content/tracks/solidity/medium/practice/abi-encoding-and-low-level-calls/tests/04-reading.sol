/// A turntable whose heading() always fails.
contract SilentTurntable {
    function heading() external pure returns (uint16) {
        revert("sensor offline");
    }
}

/// A contract whose heading() returns two words instead of one.
contract WideTurntable {
    function heading() external pure returns (uint256, uint256) {
        return (1, 2);
    }
}

contract ReadingTest is Test {
    TurntablePanel panel;
    Turntable turntable;

    function setUp() public {
        panel = new TurntablePanel();
        turntable = new Turntable(address(panel));
    }

    function test_reads_each_new_heading() public {
        uint16[3] memory turns = [uint16(0), 271, 359];
        for (uint256 i = 0; i < turns.length; i++) {
            panel.send(address(turntable), panel.rotateCommand(turns[i]));
            assertEq(panel.headingOf(address(turntable)), turns[i], "the heading read after each rotation");
        }
    }

    function test_read_fails_without_code() public {
        vm.expectRevert(TurntablePanel.ReadFailed.selector);
        panel.headingOf(address(0xD0E));
    }

    function test_read_fails_when_the_call_fails() public {
        SilentTurntable silent = new SilentTurntable();
        vm.expectRevert(TurntablePanel.ReadFailed.selector);
        panel.headingOf(address(silent));
    }

    function test_read_fails_on_the_wrong_shape_of_answer() public {
        WideTurntable wide = new WideTurntable();
        vm.expectRevert(TurntablePanel.ReadFailed.selector);
        panel.headingOf(address(wide));
    }
}
