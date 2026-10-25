// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title An apprentice's bonus, vesting over time
/// @notice The boatyard locks the bonus in ether when the apprenticeship starts. Nothing vests
///         before the cliff; from then on the vested amount grows linearly until the end of the
///         schedule. The apprentice collects what has vested, at most once a week.
contract ApprenticeBonus {
    /// @notice The shortest time between two releases.
    uint256 public constant COOLDOWN = 7 days;

    address public immutable apprentice;
    uint256 public immutable start;
    uint256 public immutable cliff;
    uint256 public immutable duration;
    uint256 public immutable total;

    /// @notice Wei paid out so far.
    uint256 public released;
    /// @notice When the last release happened; 0 before the first.
    uint256 public lastRelease;

    event Released(address indexed to, uint256 amount);

    error BadSchedule();
    error NotApprentice(address caller);
    error NothingToRelease();
    error TooSoon(uint256 nextRelease);
    error PaymentFailed();

    /// @param apprentice_ Who receives the bonus.
    /// @param start_ When vesting starts (a Unix time in seconds).
    /// @param cliff_ Seconds after `start_` before anything vests.
    /// @param duration_ Seconds after `start_` until everything has vested.
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

    /// @notice How much of the bonus has vested at time `t`, released or not.
    function vestedAt(uint256 t) public view returns (uint256) {
        if (t < start + cliff) return 0; // covers t < start too, so t - start cannot underflow
        if (t >= start + duration) return total;
        return total * (t - start) / duration; // multiply before dividing
    }

    /// @notice What the apprentice could collect now.
    function releasable() public view returns (uint256) {
        return vestedAt(block.timestamp) - released;
    }

    /// @notice Pays the apprentice everything that has vested and not yet been paid.
    function release() external {
        if (msg.sender != apprentice) revert NotApprentice(msg.sender);
        if (lastRelease != 0 && block.timestamp < lastRelease + COOLDOWN) {
            revert TooSoon(lastRelease + COOLDOWN);
        }
        uint256 amount = releasable();
        if (amount == 0) revert NothingToRelease();

        // Effects before the payment: a re-entering apprentice finds nothing left.
        released += amount;
        lastRelease = block.timestamp;
        emit Released(apprentice, amount);

        (bool ok,) = apprentice.call{value: amount}("");
        if (!ok) revert PaymentFailed();
    }
}
