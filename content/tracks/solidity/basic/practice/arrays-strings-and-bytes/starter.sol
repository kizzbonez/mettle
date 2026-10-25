// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice The beekeeping club's roll of hive names.
contract HiveRoll {
    uint256 public constant MAX_NAME_BYTES = 16;
    uint256 public constant MAX_HIVES = 50;

    string[] public hives;

    error EmptyName();
    error NameTooLong(uint256 length, uint256 max);
    error RollFull(uint256 max);
    error DuplicateName(string name);
    error NoSuchHive(uint256 index, uint256 count);

    function hiveCount() external view returns (uint256) {
        return hives.length;
    }

    /// @notice Adds a hive. Names are 1 to 16 bytes long and unique (case counts).
    function addHive(string memory name) external {
        // Task 1: four checks in order, then push the name.
        revert("not implemented: addHive");
    }

    /// @notice Removes the hive at `index`; the last hive moves into its place.
    function removeHive(uint256 index) external {
        // Task 2: swap-and-pop.
        revert("not implemented: removeHive");
    }

    /// @notice The names that start with the byte `letter`, in roll order.
    function hivesStartingWith(bytes1 letter) external view returns (string[] memory found) {
        // Task 3: count, allocate a memory array, fill it.
        revert("not implemented: hivesStartingWith");
    }

    /// @notice The text for the hive's plaque, such as "Heather - kept by Ada".
    function plaque(uint256 index, string memory keeper) external view returns (string memory) {
        // Task 4: join the pieces with string.concat.
        revert("not implemented: plaque");
    }
}
