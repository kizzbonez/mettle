---
title: Gas Optimization
summary: Measure gas before changing anything, then cut what really costs, storage, with packed slots, immutable values, cached reads, calldata, transient locks and bitmaps, and stop where clarity matters more than a few hundred gas.
minutes: 40
objectives:
  - Measure one call with vm.lastFrameGas in a budget test and compare runs with forge snapshot --diff
  - Pack state variables and struct fields into fewer slots and check the result with forge inspect
  - Remove repeated storage reads and writes, and choose immutable, calldata and transient storage where they pay
  - Store many flags in a bitmap and judge when an optimisation is not worth its cost in clarity
---

## Outline

1. Measure first
2. What costs gas
3. Packing storage slots
4. Reading and writing storage less
5. Calldata, loop counters and short-circuits
6. Transient storage for locks
7. Bitmaps
8. When readability wins

## Measure first

Optimise only what you have measured. Besides `forge test --gas-report`, two tools help.

A **gas budget test** measures one call and fails when it costs too much. `vm.lastFrameGas()`
(Medium 07) returns the gas of the last call the test made. Foundry runs each state-changing call
of a test as its own transaction, so its `gasTotalUsed` includes the 21,000 gas every
transaction pays and its calldata, before refunds; a `view` or `pure` call is measured alone.

```solidity
function test_gas_budget_book() public {
    hotel.book(7, 1_800_000_000, 3);
    uint256 used = vm.lastFrameGas().gasTotalUsed;
    assertLt(used, 60_000, "gas used by book()");
}
```

Against the first `Bookings` contract below:

```text
[FAIL: gas used by book(): 111063 >= 60000] test_gas_budget_book() (gas: 122306)
```

The figure in brackets covers the whole test. `forge snapshot` writes every test's gas to
`.gas-snapshot`, which you commit. After a change, `forge snapshot --diff` compares a new run
with it, and `forge snapshot --check` fails a CI job on any change (`--tolerance 5` allows 5%):

```text
↓ BookingsTest::test_book() (gas: 128150 → 56964 | -71186 -55.549%)
--------------------------------------------------------------------------------
Total tests: 1, ↑ 0, ↓ 1, ━ 0
Overall gas change: -71186 (-55.549%)
```

The sandbox compiles with the optimizer off; storage costs, which dominate, are the same with it
on. Measure with the settings you deploy with.

## What costs gas

| Operation | Gas |
| --- | ---: |
| Read a slot first touched in this transaction (cold `SLOAD`, EIP-2929) | 2,100 |
| Read a slot again (warm) | 100 |
| Write zero to non-zero (`SSTORE`) | 20,000, plus 2,100 if cold |
| Write non-zero to non-zero | 2,900, plus 2,100 if cold |
| Write a slot already written in this transaction | 100 |
| `TLOAD` or `TSTORE` (EIP-1153) | 100 |
| Read a `constant` or an `immutable` | 3 |

Setting a slot back to zero, or to its value at the start of the transaction, earns a
**refund**, capped at a fifth of the transaction's gas (EIP-3529). Arithmetic costs a few gas.
So touch fewer slots, write each once, and keep fixed values out of storage.

## Packing storage slots

Storage is a list of 32-byte **slots**. The compiler places state variables in declaration order
and **packs** neighbours smaller than 32 bytes into one slot when they fit; a struct or array
always starts a new slot. One new slot costs 22,100 to write, four cost four times that:

```solidity
struct Booking { // before: four slots
    address guest;
    uint256 checkIn;
    uint256 nights;
    bool paid;
}

struct Booking { // after: 20 + 6 + 2 + 1 = 29 bytes, one slot
    address guest;
    uint48 checkIn; // seconds: enough for millions of years
    uint16 nights;
    bool paid;
}
```

That change made the snapshot diff above; the call alone fell from 111,063 to 45,633 gas. Order
matters too. `TillBefore` declares `uint64 openedAt; uint256 takings; address owner; bool
paused;` and needs three slots; `TillAfter` declares `takings` last, so the rest share slot 0:

```text
| owner    | address | 0    | 0      | 20    | src/Till.sol:TillAfter |
| openedAt | uint64  | 0    | 20     | 8     | src/Till.sol:TillAfter |
| paused   | bool    | 0    | 28     | 1     | src/Till.sol:TillAfter |
| takings  | uint256 | 1    | 0      | 32    | src/Till.sol:TillAfter |
```

(rows of `forge inspect TillAfter storageLayout`). Packing pays when the packed fields are used
together; a lone `uint8` is no cheaper than a `uint256`. A narrow type must also hold every
value it will ever get: `uint16(x)` silently truncates, so narrow with `SafeCast` (Advanced 04).

**`constant`** and **`immutable`** values are not in storage at all. A constant is fixed at
compile time; an immutable is set in the constructor and copied into the deployed code. An owner
or a fee that never changes should be one of them: 3 gas to read instead of 2,100.

## Reading and writing storage less

Each `total` or `amounts.length` in a loop is an `SLOAD`, each `total += ...` an `SSTORE`.
**Cache** them in local variables and write once:

```solidity
function sumSlow() external {
    for (uint256 i = 0; i < amounts.length; i++) {
        total += amounts[i]; // reads length, reads and writes total, every time
    }
}

function sumFast() external {
    uint256 len = amounts.length; // one read
    uint256 sum = total; // one read
    for (uint256 i = 0; i < len; i++) {
        sum += amounts[i];
    }
    total = sum; // one write
}
```

```text
sumSlow, 20 amounts: 102316
sumFast, 20 amounts: 96076
```

Only 6%: the repeated reads and writes were warm, 100 gas each, while the 20 cold reads of the
elements (42,000 gas) remain. For a struct, read the slot once into a `memory` copy, check it,
and write back only the field that changes.

## Calldata, loop counters and short-circuits

A `memory` parameter of an external function is copied out of the calldata first; a
**`calldata`** parameter is read where it is. For a `pure` function summing 100 `uint256`s:

```text
memory, i++:    53784
calldata, i++:  31220
calldata, ++i:  30742
unchecked ++i:  30698
```

Measure your own types, though: with 40 `uint32`s the memory version was cheaper here (22,627
against 23,244), because every narrow value read from calldata is checked again. The last line
wraps the increment in `unchecked { ++i; }` by hand. Since Solidity 0.8.22 the
compiler drops the overflow check itself when a `for` loop compares a local counter with `<` and
increments it by one, even with the optimizer off: 44 gas over 100 rounds is not worth the
extra lines. **Short-circuiting**: `&&` and `||` stop at the first operand that decides, so
put the cheap test first: `if (amount == 0 || balances[msg.sender] < amount)`. Custom errors
(Basic 05) are cheaper than revert strings, too.

## Transient storage for locks

A reentrancy lock only needs to hold during one transaction. In storage it costs a cold read and
two writes; a **transient** variable (Basic 08) costs 100 per access and is cleared at the end:

```text
storage lock:   26333 refunded: 2800
transient lock: 21868
```

Even after the refund it saves about 1,700 gas; OpenZeppelin's `ReentrancyGuardTransient` works
this way. A transient value lives until the end of the whole
transaction, across calls, so always reset a lock on the way out.

## Bitmaps

A `mapping(uint256 => bool)` spends a whole slot on each flag. A **bitmap** puts 256 flags in one
`uint256`: flag `id` is bit `id & 0xff` of word `id >> 8`.

```solidity
mapping(uint256 => uint256) private claimedWords;

function claimBit(uint256 id) external {
    claimedWords[id >> 8] |= 1 << (id & 0xff);
}
```

```text
bool, id 1:   43824
bool, id 2:   43824
bit, id 1:    43837
bit, id 2:    26737
bit, id 300:  43849
```

The first flag of a word pays for a new slot; its neighbours change a slot that is already
non-zero.

## When readability wins

Optimise what users call often, not a setter used once a year. Every trick costs reviewers time,
and some cost safety: never drop a check or wrap user-supplied arithmetic in `unchecked`. The
optimizer (`optimizer = true` in `foundry.toml`) saves gas with no change to the code.

## Common mistakes

- **Changing a memory copy.** `Pass memory p = passes[id]; p.visitsLeft -= 1;` leaves storage as
  it was: `[FAIL: visits left after one visit: 3 != 2]`. solc hints at it: `Warning (2018):
  Function state mutability can be restricted to view`. Write the field back.
- **Truncating casts.** `uint16(70000)` is `4464`. `SafeCast.toUint16(70000)` reverts with
  `SafeCastOverflowedUintDowncast(16, 70000)`.
- **`unchecked` on user input.** `unchecked { credit[msg.sender] -= amount; }` with a credit of 5
  and an amount of 6 leaves a credit of
  `115792089237316195423570985008687907853269984665640564039457584007913129639935`.

## Practice

1. `contract Shelf { uint128 a; uint256 b; uint128 c; }` uses three slots. Make it use two.
2. Add `isClaimed(uint256 id)` to the bitmap contract.
3. Write a test proving that a second claim in the same word costs under 30,000 gas.

### Answers

```solidity
contract ShelfPacked {
    uint128 a;
    uint128 c; // a and c share slot 0
    uint256 b;
}

function isClaimed(uint256 id) external view returns (bool) {
    return claimedWords[id >> 8] & (1 << (id & 0xff)) != 0;
}

function test_second_claim_in_a_word_is_cheap() public {
    c.claimBit(2); // setUp claimed id 1
    assertLt(vm.lastFrameGas().gasTotalUsed, 30_000, "gas of a second claim in the same word");
    assertTrue(c.isClaimed(2), "id 2 is claimed");
    assertFalse(c.isClaimed(258), "id 258 is not claimed");
}
```

```text
| a    | uint128 | 0    | 0      | 16    | src/Till.sol:ShelfPacked |
| c    | uint128 | 0    | 16     | 16    | src/Till.sol:ShelfPacked |
| b    | uint256 | 1    | 0      | 32    | src/Till.sol:ShelfPacked |

[PASS] test_second_claim_in_a_word_is_cheap() (gas: 48832)
```

## Key takeaways

- Measure first: `vm.lastFrameGas()` for a call, `forge snapshot --diff` across changes.
- Storage dominates: 22,100 for a new slot, 2,100 for a cold read, 100 when warm.
- Pack fields used together, make fixed values `immutable`, read each slot once.
- Use calldata, transient locks and bitmaps; plain `++i` loops are already unchecked.
- Stop when a saving makes review harder.

## Further reading

- [Solidity documentation: Layout of state variables in storage](https://docs.soliditylang.org/en/latest/internals/layout_in_storage.html)
- [Foundry reference: forge snapshot](https://getfoundry.sh/forge/reference/forge-snapshot)
- [EIP-2929: Gas cost increases for state access opcodes](https://eips.ethereum.org/EIPS/eip-2929)
- [Solidity 0.8.22 release announcement (unchecked loop increments)](https://soliditylang.org/blog/2023/10/25/solidity-0.8.22-release-announcement/)
