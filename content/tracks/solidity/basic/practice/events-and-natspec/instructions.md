Complete `SaplingRegister` in `solution.sol`. The struct, the storage, the `Measured` event, the
two errors and most of `plant` are written for you. The map app depends on the exact shape of
every event, so declare and emit them exactly as described.

1. **Declare the event** `Planted` with four parameters, in this order: `uint256 saplingId`,
   `uint256 plot`, `address planter` and `string species`. Index the first three, so the app can
   filter by sapling, by plot and by volunteer; leave `species` unindexed, so the app can read
   the name and show it.
2. **In `plant(uint256 plot, string calldata species)`**, after the sapling is stored, emit
   `Planted(saplingId, plot, msg.sender, species)`. Ids start at 1 and go up by one with each
   planting; that part is already written.
3. **Write `recordHeight(uint256 saplingId, uint256 heightCm) external`**:
   - an id that was never planted (its planter is the zero address) reverts with
     `UnknownSapling(saplingId)`;
   - anyone but the sapling's planter is refused with `NotPlanter(saplingId, msg.sender)`;
   - otherwise store the new height and emit `Measured(saplingId, previousCm, newCm)`, the
     height before this call first and the new height second. A new sapling's height is 0.
4. **Document** `plant` and `recordHeight` with `@notice`, `@dev` and `@param` (and `@return`
   for `plant`). The tests cannot read comments, so this step is for you and your reviewers;
   `solution.sol` in the answer shows one way to write them.

Example, with Ada at `address(0xA11CE)`:

```solidity
SaplingRegister register = new SaplingRegister();
vm.prank(ada);
register.plant(4, "rowan");       // emits Planted(1, 4, ada, "rowan")
vm.prank(ada);
register.recordHeight(1, 30);     // emits Measured(1, 0, 30)
vm.prank(ada);
register.recordHeight(1, 42);     // emits Measured(1, 30, 42)
register.recordHeight(1, 50);     // reverts with NotPlanter(1, <the caller>)
register.recordHeight(9, 50);     // reverts with UnknownSapling(9)
```

A `Planted` log has four topics: the event's signature hash, then `saplingId`, `plot` and
`planter`. Its data holds only `species`.
