// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title The scoreboard of the village cricket club
/// @notice Every ball bowled is recorded with one call: scoreRuns for a ball
/// the batters scored from (0 runs counts too), wicket for a ball on which a
/// batter was out.
contract Scoreboard {
    uint256 public runs;
    uint256 public wickets;
    uint256 public balls;

    /// @notice A ball on which the batters scored `scored` runs.
    function scoreRuns(uint256 scored) public {
        runs = runs + scored;
        balls = balls + 1;
    }

    /// @notice A ball on which a batter was out: one more wicket and one more ball.
    function wicket() public {
        wickets = wickets + 1;
        balls = balls + 1;
    }

    /// @notice Complete overs bowled so far: six balls make an over.
    function overs() public view returns (uint256) {
        return balls / 6;
    }
}
