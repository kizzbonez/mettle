`solution.sol` holds the farm's `HarvestDay` contract. Its settings are written for you: the
constant `BUNDLE_PRICE` (`0.004 ether`, which is 4000000000000000 wei), the constant `SHIFT`
(`4 hours`) and the immutable `farm`, set to the deployer by the constructor. You write one
function body.

1. Press **Run** once. The visible test fails with `` `share` is not written yet ``.
2. At the comment `YOUR CODE`, write the body of
   **`function share(uint8 morning, uint8 afternoon, uint8 pickers) public pure returns (uint256)`**,
   which returns one picker's share of the day's pay, in wei:

   ```text
   share = (morning + afternoon) × BUNDLE_PRICE ÷ pickers
   ```

   Two rules make it correct for every day:
   - **Widen before you add.** Each shift's bundles fit in a `uint8` (at most 255), but the
     day's total can reach 510, which does not. Added as `uint8`s, 200 + 100 reverts with
     `panic: arithmetic underflow or overflow (0x11)`. Convert one side to `uint256` first, as
     lesson 03 showed: `uint256(morning) + afternoon`.
   - **Multiply before you divide.** Integer division truncates. Divide the 7 bundles of a day
     by 2 pickers first and you get 3 bundles each, losing half a bundle's pay; multiply 7 by
     `BUNDLE_PRICE` first and the division loses less than one wei.

   Use the `BUNDLE_PRICE` constant, not a number of your own, and delete the `revert` line.
   `pickers` is never 0 in the tests.
3. Press **Run** until the visible test passes, then **Submit**. The hidden tests try two full
   shifts, uneven shares and many random days, and check that the settings are unchanged.

An example day:

```solidity
HarvestDay day = new HarvestDay();
day.share(120, 95, 4);  // 215 bundles × 0.004 ether ÷ 4 = 0.215 ether = 215000000000000000
day.share(255, 255, 1); // 510 bundles: 2.04 ether, no overflow
day.share(3, 4, 2);     // 0.014 ether, not 0.012 ether
day.share(0, 1, 3);     // 1333333333333333 (0.004 ether ÷ 3, rounded down to the wei)
```

The contract's settings, read through their getters: `day.BUNDLE_PRICE()` is 4000000000000000,
`day.SHIFT()` is 14400 and `day.farm()` is the address that deployed it.
