Complete `HillClimbTimes` in `solution.sol`. Write every function body as an
`assembly ("memory-safe") { ... }` block; plain Solidity is allowed only to copy an error's
selector into a local `bytes4` before the block. Keep the signatures and the two errors.

A result word holds, from the lowest bit up:

| Bits | Field | Width |
| --- | --- | --- |
| 0 to 63 | `millis`, the time in milliseconds | 64 bits |
| 64 to 71 | `gate`, the timing gate where the time was taken | 8 bits |
| 72 to 103 | `rider`, the rider's number | 32 bits |

The bits above 103 belong to the timing system: words you are given may have them set, and every
function that reads a word must ignore them.

1. **`pack(uint32 rider, uint8 gate, uint64 millis) returns (uint256 word)`** puts the three values
   in their bits with `shl` and `or`. The arguments arrive already checked to fit their types.
2. **`riderOf`, `gateOf` and `millisOf(uint256 word) returns (uint256)`** take one field out of a
   word: shift it down with `shr`, then keep only its width with `and` and a mask
   (`0xffffffff`, `0xff`, `0xffffffffffffffff`).
3. **`highestGate(uint256 passed) returns (uint256 gate)`**: bit `n` of `passed` is set when
   the rider has passed timing gate `n`. Return the highest set bit's index, `255 - clz(passed)`. For
   `passed == 0` revert with `NoGates()`: store the selector at memory 0 and `revert(0x00, 0x04)`.
4. **`totalMillis(uint256[] calldata words) returns (uint256 total)`** adds up the `millis` field
   of every word in a Yul `for` loop. Element `i` is `calldataload(add(words.offset, shl(5, i)))`.
   If the total becomes larger than `type(uint64).max`, revert with `TimeOverflow()`. A total of
   exactly `type(uint64).max` is allowed, and an empty list totals 0.

```solidity
HillClimbTimes times = new HillClimbTimes();
uint256 w = times.pack(7, 3, 125_000);   // 0x0000000703000000000001e848
times.riderOf(w);                        // 7
times.gateOf(w);                         // 3
times.millisOf(w);                       // 125000
times.highestGate(0x0b);                 // 3: the rider passed gates 0, 1 and 3
times.highestGate(0);                    // reverts with NoGates()
// words = [w, times.pack(9, 4, 131_500)]
times.totalMillis(words);                // 256500
```

The hidden tests fuzz each function against a plain Solidity reference, with random bits above
bit 103.
