// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice What the relay needs from any wind sensor, whoever made it.
interface IAnemometer {
    /// @return The wind speed in km/h.
    function windSpeed() external view returns (uint256);
}

/// @notice The club's own sensor. Its owner sets the reading; frozen cups make it fail.
/// This contract is complete: do not change it.
contract Anemometer is IAnemometer {
    error NotOwner(address caller);
    error Iced();

    address public immutable owner;
    uint256 private speed;
    bool public iced;

    constructor(address owner_, uint256 speed_) {
        owner = owner_;
        speed = speed_;
    }

    function set(uint256 speed_, bool iced_) external {
        if (msg.sender != owner) revert NotOwner(msg.sender);
        speed = speed_;
        iced = iced_;
    }

    function windSpeed() external view returns (uint256) {
        if (iced) revert Iced();
        return speed;
    }
}

/// @notice Collects the wind readings of every sensor on the hill.
contract WindRelay {
    event SensorAdded(address indexed sensor);

    error ZeroAddress();
    error NotAContract(address sensor);
    error NoReadings();

    IAnemometer[] public sensors;

    // Task 1: deploy a new Anemometer owned by the caller, store it, emit SensorAdded.
    function install(uint256 startSpeed) external returns (Anemometer sensor) {
        revert("not implemented: install");
    }

    // Task 2: check the address, store it as an IAnemometer, emit SensorAdded.
    function connect(address sensor) external {
        revert("not implemented: connect");
    }

    function sensorCount() external view returns (uint256) {
        return sensors.length;
    }

    // Task 3: return one sensor's reading; let its errors bubble up.
    function readingOf(uint256 index) external view returns (uint256) {
        revert("not implemented: readingOf");
    }

    // Task 4: read every sensor with try/catch and skip the ones that fail.
    function strongestGust() external view returns (uint256 top, uint256 working) {
        revert("not implemented: strongestGust");
    }
}
