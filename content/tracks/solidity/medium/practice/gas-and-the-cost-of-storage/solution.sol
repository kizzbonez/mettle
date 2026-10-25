// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title The shearing shed's tally
/// @notice The shed boss logs every fleece. Each fleece is announced in an event; storage keeps
///         only the running totals that contracts need, each written once per call.
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

    /// @notice Logs a run of fleeces shorn by `shearer`, one weight in grams each.
    function logRun(address shearer, uint32[] calldata grams) external onlyBoss {
        uint256 n = grams.length;
        if (n == 0) revert EmptyRun();

        uint256 today = day; // one storage read instead of one per fleece
        uint256 sum;
        for (uint256 i = 0; i < n; i++) {
            uint256 g = grams[i];
            if (g == 0 || g > MAX_GRAMS) revert BadWeight(i);
            sum += g;
            emit Fleece(today, shearer, g); // the history lives in events
        }

        // Each total is read and written once, however long the run.
        todayFleeces += n;
        todayGrams += sum;
        shornBy[shearer] += n;
    }

    /// @notice Closes the day: announces its totals, adds them to the all-time totals and starts
    ///         the next day from zero.
    function closeDay() external onlyBoss {
        uint256 fleeces = todayFleeces;
        uint256 grams = todayGrams;
        emit DayClosed(day, fleeces, grams);

        totalFleeces += fleeces;
        totalGrams += grams;
        // Setting the counters back to zero frees two slots and earns a refund.
        todayFleeces = 0;
        todayGrams = 0;
        day += 1;
    }
}
