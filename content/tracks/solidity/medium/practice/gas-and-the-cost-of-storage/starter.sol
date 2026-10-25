// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title The shearing shed's tally
contract ShearingTally {
    /// @notice The heaviest fleece the scales can weigh, in grams.
    uint256 public constant MAX_GRAMS = 15_000;

    address public immutable boss;

    /// @notice The day being shorn, starting at 1.
    uint256 public day = 1;
    uint256 public todayFleeces;
    uint256 public todayGrams;
    uint256 public totalFleeces;
    uint256 public totalGrams;
    mapping(address shearer => uint256) public shornBy;

    event Fleece(uint256 indexed day, address indexed shearer, uint256 grams);
    event DayClosed(uint256 indexed day, uint256 fleeces, uint256 grams);

    error NotBoss(address caller);
    error EmptyRun();
    error BadWeight(uint256 index);

    constructor() {
        boss = msg.sender;
    }

    modifier onlyBoss() {
        if (msg.sender != boss) revert NotBoss(msg.sender);
        _;
    }

    // Task 1: log a run. Announce every fleece in an event; write each total once.
    function logRun(address shearer, uint32[] calldata grams) external onlyBoss {
        revert("not implemented: logRun");
    }

    // Task 2: close the day and start the next one from zero.
    function closeDay() external onlyBoss {
        revert("not implemented: closeDay");
    }
}
