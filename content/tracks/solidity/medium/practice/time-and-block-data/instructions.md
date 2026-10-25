Complete `ApprenticeBonus` in `solution.sol`. The constructor, which locks `msg.value` as the
`total` and checks the schedule, and all state, events and errors are written for you. Times are
Unix times in seconds; `cliff` and `duration` are seconds after `start`.

1. **`function vestedAt(uint256 t) public view returns (uint256)`** returns how much of the bonus
   has vested at time `t`, released or not:
   - `0` before `start + cliff` (this includes any `t` before `start`: never compute `t - start`
     there, it would underflow);
   - `total` from `start + duration` on;
   - in between, `total * (t - start) / duration`, multiplied before dividing, rounded down.
2. **`function releasable() public view returns (uint256)`** returns what has vested at
   `block.timestamp` minus what has been `released`.
3. **`function release() external`** pays the apprentice. Check, in this order:
   - the caller is the `apprentice`, or revert with `NotApprentice(msg.sender)`;
   - if there has been a release before, at least `COOLDOWN` (7 days) has passed since
     `lastRelease`, or revert with `TooSoon(lastRelease + COOLDOWN)`. The first release never
     waits, even on a test chain whose clock starts at 1;
   - `releasable()` is not zero, or revert with `NothingToRelease()`.

   Then add the amount to `released`, set `lastRelease` to `block.timestamp`, emit
   `Released(apprentice, amount)`, and only then send the ether with
   `(bool ok, ) = apprentice.call{value: amount}("")`, reverting with `PaymentFailed()` if `ok` is
   false.

```solidity
// cal's bonus: 5.2 ether from 2026-01-01, a 13-week cliff, fully vested after 52 weeks
ApprenticeBonus bonus = new ApprenticeBonus{value: 5.2 ether}(cal, start, 13 weeks, 52 weeks);
bonus.vestedAt(start + 13 weeks - 1);  // 0
bonus.vestedAt(start + 13 weeks);      // 1.3 ether
bonus.vestedAt(start + 26 weeks);      // 2.6 ether
// at start + 13 weeks, cal calls release(): emits Released(cal, 1.3 ether) and pays 1.3 ether
// three days later, release() reverts with TooSoon(start + 14 weeks)
// at start + 52 weeks, release() pays the remaining 3.9 ether
```
