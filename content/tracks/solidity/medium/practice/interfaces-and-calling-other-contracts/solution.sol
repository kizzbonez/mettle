// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice What the relay needs from any wind sensor, whoever made it.
interface IAnemometer {
    /// @return The wind speed in km/h.
    function windSpeed() external view returns (uint256);
}

/// @notice The club's own sensor. Its owner sets the reading; frozen cups make it fail.
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

    /// @notice Deploys a new club anemometer owned by the caller and starts reading it.
    function install(uint256 startSpeed) external returns (Anemometer sensor) {
        // Inside the new contract's constructor msg.sender would be this relay,
        // so the caller is passed in as the owner.
        sensor = new Anemometer(msg.sender, startSpeed);
        sensors.push(sensor);
        emit SensorAdded(address(sensor));
    }

    /// @notice Starts reading a sensor that someone else deployed.
    function connect(address sensor) external {
        if (sensor == address(0)) revert ZeroAddress();
        // A call to an address without code cannot be caught by try/catch later.
        if (sensor.code.length == 0) revert NotAContract(sensor);
        sensors.push(IAnemometer(sensor));
        emit SensorAdded(sensor);
    }

    function sensorCount() external view returns (uint256) {
        return sensors.length;
    }

    /// @notice One sensor's reading. A failing sensor's error bubbles up unchanged.
    function readingOf(uint256 index) external view returns (uint256) {
        return sensors[index].windSpeed();
    }

    /// @notice The highest reading among the sensors that work, and how many worked.
    function strongestGust() external view returns (uint256 top, uint256 working) {
        for (uint256 i = 0; i < sensors.length; i++) {
            try sensors[i].windSpeed() returns (uint256 speed) {
                working++;
                if (speed > top) top = speed;
            } catch {
                // A broken sensor, whatever its error, must not silence the others.
            }
        }
        if (working == 0) revert NoReadings();
    }
}
