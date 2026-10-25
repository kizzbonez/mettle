// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Hedgerow sapling register
/// @notice Volunteers record the saplings they plant and how tall they grow.
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

    /// @notice A volunteer planted a sapling.
    /// @param saplingId The new sapling's id.
    /// @param plot The plot it was planted on.
    /// @param planter The volunteer who planted it.
    /// @param species What it is, kept in the data so that apps can show it.
    event Planted(uint256 indexed saplingId, uint256 indexed plot, address indexed planter, string species);

    /// @notice A sapling's planter recorded a new height.
    event Measured(uint256 indexed saplingId, uint256 previousCm, uint256 newCm);

    error UnknownSapling(uint256 saplingId);
    error NotPlanter(uint256 saplingId, address caller);

    /// @notice Record a sapling you have just planted.
    /// @dev Ids start at 1. Emits Planted.
    /// @param plot The plot you planted it on.
    /// @param species The species, such as "hawthorn".
    /// @return saplingId The id of the new sapling.
    function plant(uint256 plot, string calldata species) external returns (uint256 saplingId) {
        saplingId = ++saplingCount;
        saplings[saplingId] = Sapling({species: species, plot: plot, planter: msg.sender, heightCm: 0});
        emit Planted(saplingId, plot, msg.sender, species);
    }

    /// @notice Record how tall one of your saplings is now.
    /// @dev Reverts with UnknownSapling for an id that was never planted and with NotPlanter
    /// for anyone but its planter. Emits Measured with the old height first.
    /// @param saplingId The sapling you measured.
    /// @param heightCm Its height in centimetres.
    function recordHeight(uint256 saplingId, uint256 heightCm) external {
        Sapling storage sapling = saplings[saplingId];
        if (sapling.planter == address(0)) revert UnknownSapling(saplingId);
        if (sapling.planter != msg.sender) revert NotPlanter(saplingId, msg.sender);

        uint256 previous = sapling.heightCm;
        sapling.heightCm = heightCm;
        emit Measured(saplingId, previous, heightCm);
    }
}
