Complete `ShearingTally` in `solution.sol`. Its state, events, errors and the `onlyBoss` modifier
are declared for you. Other contracts read the totals, so they stay in storage; the fleece-by-fleece
history is only for the shed's app, so it goes in events. Do not add state variables.

1. **`function logRun(address shearer, uint32[] calldata grams) external onlyBoss`** logs a run of
   fleeces by `shearer`, one weight in grams each:
   - revert with `EmptyRun()` if `grams` is empty;
   - revert with `BadWeight(i)`, `i` the index of the first bad weight, if a weight is `0` or above
     `MAX_GRAMS` (15,000); a refused run records nothing;
   - emit `Fleece(day, shearer, grams[i])` for every fleece, in order;
   - add the number of fleeces to `todayFleeces` and to `shornBy[shearer]`, and their weight to
     `todayGrams`.

   Read `day` once and add up the run in local variables, then write each of the three totals
   **once**, after the loop.
2. **`function closeDay() external onlyBoss`** emits `DayClosed(day, todayFleeces, todayGrams)`,
   adds today's figures to `totalFleeces` and `totalGrams`, sets `todayFleeces` and `todayGrams`
   back to zero (earning a refund for each) and moves `day` on by one. The closed day's figures
   live on in the event: do not keep a copy in storage.

**Gas budgets.** The tests measure each call with `vm.lastFrameGas().gasTotalUsed`, which includes
the transaction's 21,000, for runs of 40 fleeces weighing 2,000 to 7,999 grams:

| Call | Budget |
| --- | --- |
| the tally's first run (every total starts at zero) | 210,000 |
| a second run by the same shearer | 156,000 |
| `closeDay` after two runs | 90,000, with a refund of at least 9,600 |

Writing a total inside the loop, or keeping each fleece in a storage array, goes over budget.

```solidity
ShearingTally tally = new ShearingTally();   // the deployer is the boss; day is 1
// tally.logRun(ana, [3200, 4100, 2900])     emits Fleece(1, ana, 3200), Fleece(1, ana, 4100), ...
// tally.todayFleeces() == 3, tally.todayGrams() == 10200, tally.shornBy(ana) == 3
// tally.closeDay()                          emits DayClosed(1, 3, 10200)
// tally.day() == 2, tally.todayFleeces() == 0, tally.totalGrams() == 10200
```
