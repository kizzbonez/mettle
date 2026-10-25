// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title An apprentice's bonus, vesting over time
contract ApprenticeBonus {
    uint256 public constant COOLDOWN = 7 days;

    address public immutable apprentice;
    uint256 public immutable start;
    uint256 public immutable cliff;
    uint256 public immutable duration;
    uint256 public immutable total;

    uint256 public released;
    uint256 public lastRelease;

    event Released(address indexed to, uint256 amount);

    error BadSchedule();
    error NotApprentice(address caller);
    error NothingToRelease();
    error TooSoon(uint256 nextRelease);
    error PaymentFailed();

    constructor(address apprentice_, uint256 start_, uint256 cliff_, uint256 duration_) payable {
        if (apprentice_ == address(0) || msg.value == 0 || duration_ == 0 || cliff_ > duration_) {
            revert BadSchedule();
        }
        apprentice = apprentice_;
        start = start_;
        cliff = cliff_;
        duration = duration_;
        total = msg.value;
    }

    // Task 1: how much has vested at time t.
    function vestedAt(uint256 t) public view returns (uint256) {
        revert("not implemented: vestedAt");
    }

    // Task 2: what the apprentice could collect now.
    function releasable() public view returns (uint256) {
        revert("not implemented: releasable");
    }

    // Task 3: pay out what has vested, at most once per COOLDOWN.
    function release() external {
        revert("not implemented: release");
    }
}
