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
        uint256 length = bytes(name).length; // bytes, not characters
        if (length == 0) revert EmptyName();
        if (length > MAX_NAME_BYTES) revert NameTooLong(length, MAX_NAME_BYTES);
        if (hives.length == MAX_HIVES) revert RollFull(MAX_HIVES);

        // The loop is bounded by MAX_HIVES; the cheap checks above run first.
        bytes32 wanted = keccak256(bytes(name));
        for (uint256 i = 0; i < hives.length; i++) {
            if (keccak256(bytes(hives[i])) == wanted) revert DuplicateName(name);
        }
        hives.push(name);
    }

    /// @notice Removes the hive at `index`; the last hive moves into its place.
    function removeHive(uint256 index) external {
        if (index >= hives.length) revert NoSuchHive(index, hives.length);
        hives[index] = hives[hives.length - 1];
        hives.pop();
    }

    /// @notice The names that start with the byte `letter`, in roll order.
    function hivesStartingWith(bytes1 letter) external view returns (string[] memory found) {
        uint256 matches = 0;
        for (uint256 i = 0; i < hives.length; i++) {
            if (bytes(hives[i])[0] == letter) matches++;
        }

        found = new string[](matches);
        uint256 next = 0;
        for (uint256 i = 0; i < hives.length; i++) {
            if (bytes(hives[i])[0] == letter) {
                found[next] = hives[i];
                next++;
            }
        }
    }

    /// @notice The text for the hive's plaque, such as "Heather - kept by Ada".
    function plaque(uint256 index, string memory keeper) external view returns (string memory) {
        if (index >= hives.length) revert NoSuchHive(index, hives.length);
        return string.concat(hives[index], " - kept by ", keeper);
    }
}
