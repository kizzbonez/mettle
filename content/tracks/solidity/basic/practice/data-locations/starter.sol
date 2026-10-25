// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice The rowing club's boat log: every outing adds to a boat's totals.
contract BoatLog {
    struct Boat {
        string name;
        uint256 outings;
        uint256 metres;
    }

    uint256 public constant MAX_BATCH = 20;
    uint256 public constant MAX_PER_TX = 25;

    Boat[] public boats;
    // Task 3: declare the transient counter here.

    error NoSuchBoat(uint256 id);
    error ZeroDistance(uint256 id);
    error LengthMismatch(uint256 ids, uint256 distances);
    error BatchTooLarge(uint256 size, uint256 max);
    error TooManyThisTransaction(uint256 max);

    /// @notice Adds a boat and returns its id, its index in `boats`.
    function addBoat(string calldata name) external returns (uint256 id) {
        id = boats.length;
        boats.push(Boat({name: name, outings: 0, metres: 0}));
    }

    function boatCount() external view returns (uint256) {
        return boats.length;
    }

    /// @notice A memory copy of boat `id`'s record.
    function boat(uint256 id) external view returns (Boat memory) {
        if (id >= boats.length) revert NoSuchBoat(id);
        return boats[id];
    }

    /// @notice Logs one outing of `metres` metres for boat `id`.
    function logOuting(uint256 id, uint256 metres) external {
        _record(id, metres);
    }

    /// @notice Logs several outings at once: `distances[i]` metres for boat `ids[i]`.
    function logOutings(uint256[] calldata ids, uint256[] calldata distances) external {
        // Task 2
        revert("not implemented: logOutings");
    }

    function _record(uint256 id, uint256 metres) internal {
        if (id >= boats.length) revert NoSuchBoat(id);
        if (metres == 0) revert ZeroDistance(id);
        // Task 3: the per-transaction limit goes here.

        // Task 1: this compiles and runs, but no outing is ever saved. Fix it.
        Boat memory logged = boats[id];
        logged.outings += 1;
        logged.metres += metres;
    }
}
