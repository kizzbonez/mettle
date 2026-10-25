`solution.sol` starts as a **working** `GardenPasses` contract that wastes gas. Make it cheaper.
Every function must keep its exact signature, its checks in the same order, its custom errors
and its events: the hidden tests check the old behaviour as well as the new budgets. You may add
private functions, modifiers and comments, and change how the state is stored.

The tests measure each call with `vm.lastFrameGas().gasTotalUsed`. Every state-changing call in a
test is its own transaction, so the figure includes the 21,000 gas every transaction pays and the
calldata.

| Call | Starter uses | Budget (must be below) |
| --- | ---: | ---: |
| `issue` of a second pass | 121,213 | 65,000 |
| `checkIn` after an earlier visit, so `totalVisits` is not zero | 40,898 | 37,000 |
| `cancel` | 30,398 | 29,500 |
| `checkInGroup` with ten passes | 158,455 | 125,000 |
| eight `claimSeeds` calls, passes 1 to 8, added up | 370,984 | 290,000 |

1. **Pack `Pass` into one slot.** Its fields fit in 29 bytes when `validFrom` is a `uint48` and
   `visitsLeft` a `uint16`, which are the types `issue` and `passOf` already use. In `issue`, read
   `passCount` once and write the whole struct in one assignment.
2. **Make `warden` immutable.** It is set in the constructor and never changes.
3. **Read each pass once in `checkIn` and `cancel`.** Copy the slot into a `Pass memory` once (or
   use one `Pass storage` reference and few reads), check it, and write back only `visitsLeft`
   (or `active`). Checks stay in this order: holder, active, not too early, visits left.
4. **`checkInGroup(uint256[] calldata ids)`**: take `calldata`, read the length once, and add the
   group's size to `totalVisits` with one write after the loop. If any pass in the group fails a
   check, the whole call reverts with that pass's error, as before.
5. **Record seed claims in a bitmap.** Replace `mapping(uint256 => bool)` with
   `mapping(uint256 => uint256)`: pass `id` is bit `id & 0xff` of word `id >> 8`. Set the bit in
   `claimSeeds`, and read it in `hasClaimedSeeds`. Ids above 255 must work too.

```solidity
GardenPasses garden = new GardenPasses();   // you are the warden
garden.issue(ada, 1_000_000, 3);              // pass 1, emits PassIssued(1, ada, 1000000, 3)
garden.issue(ada, 1_000_000, 3);              // pass 2: must use under 65,000 gas
// as ada:
garden.checkIn(1);                            // emits Visited(1, 2)
garden.checkIn(2);                            // must use under 37,000 gas (totalVisits was 1)
garden.passOf(1);                             // (ada, 1000000, 2, true)
garden.claimSeeds(1);                         // hasClaimedSeeds(1) is true, (2) still false
```

Run the visible test first: it prints what your `issue` and `checkIn` use. A careful solution
uses about 53,500 and 35,100.
