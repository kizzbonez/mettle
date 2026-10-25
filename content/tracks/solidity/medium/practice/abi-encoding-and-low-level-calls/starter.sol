// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title The engine shed turntable
/// @notice Turns the turntable and works the gate. Only its panel may command it. (Given: complete.)
contract Turntable {
    address public panel;
    uint16 private _heading;
    bool private _gateOpen;

    error NotPanel(address caller);
    error BadHeading(uint16 degrees);

    constructor(address panel_) {
        panel = panel_;
    }

    modifier onlyPanel() {
        if (msg.sender != panel) revert NotPanel(msg.sender);
        _;
    }

    /// @notice Turns the turntable to `degrees` (0 to 359) and returns the new heading.
    function rotate(uint16 degrees) external onlyPanel returns (uint16) {
        if (degrees >= 360) revert BadHeading(degrees);
        _heading = degrees;
        return degrees;
    }

    function openGate() external onlyPanel {
        _gateOpen = true;
    }

    function closeGate() external onlyPanel {
        _gateOpen = false;
    }

    /// @notice Gives control of the turntable to another panel. Never to be reached through `send`.
    function handOver(address newPanel) external onlyPanel {
        panel = newPanel;
    }

    function heading() external view returns (uint16) {
        return _heading;
    }

    function gateOpen() external view returns (bool) {
        return _gateOpen;
    }
}

/// @title The signal crew's panel
contract TurntablePanel {
    address public immutable owner;
    mapping(address => bool) public isOperator;

    error NotOwner(address caller);
    error NotOperator(address caller);
    error ForbiddenCommand(bytes4 selector);
    error NoCode(address target);
    error ReadFailed();

    constructor() {
        owner = msg.sender;
        isOperator[msg.sender] = true;
    }

    function addOperator(address who) external {
        if (msg.sender != owner) revert NotOwner(msg.sender);
        isOperator[who] = true;
    }

    // Task 1: the calldata of Turntable.rotate(degrees).
    function rotateCommand(uint16 degrees) public pure returns (bytes memory) {
        revert("not implemented: rotateCommand");
    }

    // Task 2: relay an allowed command to the turntable.
    function send(address turntable, bytes calldata command) external returns (bytes memory) {
        revert("not implemented: send");
    }

    // Task 3: read the turntable's heading with staticcall.
    function headingOf(address turntable) external view returns (uint16) {
        revert("not implemented: headingOf");
    }
}
