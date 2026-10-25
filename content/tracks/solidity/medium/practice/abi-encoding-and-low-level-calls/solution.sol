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
/// @notice Relays encoded commands from the crew on shift to a turntable, allowing only the
///         commands a crew member needs.
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

    /// @notice The calldata of `Turntable.rotate(degrees)`, built with a type-checked encoder.
    function rotateCommand(uint16 degrees) public pure returns (bytes memory) {
        return abi.encodeCall(Turntable.rotate, (degrees));
    }

    /// @notice Sends `command` to `turntable` and returns what the turntable returned.
    /// @dev Only rotate, openGate and closeGate may pass: forwarding any calldata would let a
    ///      crew member call handOver through the panel. A failing turntable's error is re-thrown
    ///      as is.
    function send(address turntable, bytes calldata command) external returns (bytes memory) {
        if (!isOperator[msg.sender]) revert NotOperator(msg.sender);

        bytes4 selector = bytes4(command); // missing bytes count as zero
        if (!_allowed(selector)) revert ForbiddenCommand(selector);

        // A low-level call to an address without code "succeeds" and does nothing.
        if (turntable.code.length == 0) revert NoCode(turntable);

        (bool ok, bytes memory result) = turntable.call(command);
        if (!ok) {
            // Bubble up the turntable's revert data unchanged.
            assembly ("memory-safe") {
                revert(add(result, 32), mload(result))
            }
        }
        return result;
    }

    /// @dev The commands a crew member may send: an allowlist, never a blocklist.
    function _allowed(bytes4 selector) private pure returns (bool) {
        return selector == Turntable.rotate.selector || selector == Turntable.openGate.selector
            || selector == Turntable.closeGate.selector;
    }

    /// @notice Reads a turntable's heading with staticcall.
    function headingOf(address turntable) external view returns (uint16) {
        (bool ok, bytes memory data) = turntable.staticcall(abi.encodeCall(Turntable.heading, ()));
        if (!ok || data.length != 32) revert ReadFailed();
        return abi.decode(data, (uint16));
    }
}
