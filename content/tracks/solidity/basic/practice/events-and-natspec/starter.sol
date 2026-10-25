// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SaplingRegister {
    struct Sapling {
        string species;
        uint256 plot;
        address planter;
        uint256 heightCm;
    }

    /// @notice How many saplings have been planted; ids run from 1 to this number.
    uint256 public saplingCount;
    mapping(uint256 => Sapling) public saplings;

    // Task 1: declare the Planted event here.

    event Measured(uint256 indexed saplingId, uint256 previousCm, uint256 newCm);

    error UnknownSapling(uint256 saplingId);
    error NotPlanter(uint256 saplingId, address caller);

    function plant(uint256 plot, string calldata species) external returns (uint256 saplingId) {
        saplingId = ++saplingCount;
        saplings[saplingId] = Sapling({species: species, plot: plot, planter: msg.sender, heightCm: 0});
        // Task 2: emit Planted here.
    }

    // Task 3: write recordHeight.
    function recordHeight(uint256 saplingId, uint256 heightCm) external {
        revert("not implemented: recordHeight");
    }
}
