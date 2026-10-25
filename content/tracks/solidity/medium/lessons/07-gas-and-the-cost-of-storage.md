---
title: Gas and the Cost of Storage
summary: Learn what gas pays for, measure the real cost of storage writes, cold and warm access, refunds, memory and calldata on the sandbox's EVM, see the 63/64 rule and the contract size limit, read gas reports and snapshots, assert gas budgets in tests with vm.lastFrameGas, and pick up the habits that avoid waste.
minutes: 35
objectives:
  - Predict the cost of a storage write from the slot's old and new value and whether it is cold or warm
  - Explain refunds, memory expansion, calldata pricing, the 63/64 rule and the 24,576-byte size limit
  - Measure gas with gasleft, vm.lastFrameGas, forge test --gas-report and forge snapshot, and assert a gas budget in a test
  - Choose between storage, events and local variables to avoid paying for storage you do not need
---

## Outline

1. What gas pays for
2. Storage writes, cold and warm
3. Refunds and the cost of a whole transaction
4. Memory and calldata
5. Calls: the 63/64 rule
6. Contract size
7. Measuring: reports, snapshots and budgets
8. Habits that avoid waste

## What gas pays for

Every EVM instruction has a price in **gas** set by the protocol, and a transaction's fee is the
gas it used times the gas price (base fee plus priority fee, Basic 01). Prices follow what
the network must do: adding two numbers costs 3 gas, but storage is kept by every node forever,
so it costs thousands. Storage is where contracts spend most, so this lesson starts there.

The schedule changes with forks. Every number below was measured on the sandbox's local EVM
(`osaka`, optimizer off). The upcoming Glamsterdam fork, on testnets now with no mainnet date,
plans to reprice state access and storage writes (EIP-8038). Learn the shape, and measure.

## Storage writes, cold and warm

`gasleft()` returns the gas still available, so the difference around a line is what it cost:

```solidity
contract Slot {
    uint256 public value;

    function writeMeasured(uint256 v) external returns (uint256 used) {
        uint256 g = gasleft();
        value = v;
        used = g - gasleft();
    }

    function readTwice() external view returns (uint256 cold, uint256 warm) {
        uint256 g = gasleft();
        uint256 a = value;
        cold = g - gasleft();
        g = gasleft();
        uint256 b = value;
        warm = g - gasleft();
        a;
        b;
    }
}
```

A test calls `writeMeasured(1)`, `writeMeasured(2)`, `writeMeasured(2)`, then `readTwice()`:

```text
  write 0->1 inside: 22120
  write 1->2 inside: 5020
  write 2->2 inside: 2220
  cold read, warm read: 2116 116
```

About 20 gas of each figure is the measuring itself. Since Berlin (EIP-2929, 2021) the first
access to a storage slot in a transaction is **cold** and costs 2,100 extra; later accesses are
**warm**. A read costs 2,100 cold and 100 warm. A write costs:

| The slot goes from | Cold | Warm, first write |
| --- | --- | --- |
| zero to non-zero | 22,100 | 20,000 |
| non-zero to another non-zero | 5,000 | 2,900 |
| a value to the same value | 2,200 | 100 |

A slot already written in this transaction is **dirty**: writing it again costs 100. Accounts work
the same way: the first call, `balance` or `code` of an address costs 2,600, later ones 100.
Foundry runs each top-level call of a test as its own transaction, which is why the slot was cold
every time.

## Refunds and the cost of a whole transaction

Setting a slot back to zero frees state, so it earns a **refund** of 4,800 gas, paid back when
the transaction ends and capped at one fifth of the gas used (EIP-3529). The cheatcode
`vm.lastFrameGas()` reports the last call; with Foundry's isolation that is the whole transaction,
including the 21,000 every transaction pays before any code runs:

```solidity
slot.set(1);
show("0 -> 1"); // logs vm.lastFrameGas().gasTotalUsed and .gasRefunded
slot.set(2);
show("1 -> 2");
slot.set(2);
show("2 -> 2");
slot.set(0);
show("2 -> 0");
```

```text
  0 -> 1 43718 0
  1 -> 2 26618 0
  2 -> 2 23818 0
  2 -> 0 26606 4800
```

The last transaction used 26,606 and got 4,800 back. Refunds lower the bill; they never make
storage free, and they cannot pay for more than a fifth of a transaction. Clearing a slot that
will soon be written again is often a loss: the next write pays 22,100 instead of 5,000.

## Memory and calldata

**Memory** costs 3 gas per 32-byte word plus words squared divided by 512, so it grows
quadratically. Allocating `new uint256[](n)` in a `pure` function, the call measured with
`vm.lastFrameGas()` (n, gas, refund):

```text
  0 684 0
  10 796 0
  100 1357 0
  1000 8712 0
  10000 256282 0
```

Ten times the words cost 6 times the gas at 1,000 and 29 times at 10,000. Keep big arrays out of
memory. **Calldata**, the transaction's input, costs 4 gas per zero byte and 16 per non-zero byte,
with a floor of 10 and 40 for data-heavy transactions since Pectra (EIP-7623). The same write
with a different argument:

```text
  set(1): 43718
  set(max): 44090
```

`type(uint256).max` has 31 more non-zero bytes than `1`: 31 times 12 is the 372 gas between them.

## Calls: the 63/64 rule

A call can forward at most 63/64 of the gas left (EIP-150), so the caller keeps enough to handle
the callee failing. A caller given 1,000,000 gas measures itself and a callee that returns
`gasleft()`:

```text
  before the call: 999536
  inside the callee: 981163
```

After the call's own cost (2,600 for a cold address), the callee got 63/64 of the rest. Deep call
chains get less and less, and a callee can run out of gas while your function carries on, so
always check the result of a call. One transaction may use at most 16,777,216 gas (EIP-7825,
Fusaka), so a loop that needs more can never succeed.

## Contract size

Deployed code may be at most 24,576 bytes (EIP-170) and the creation code 49,152 bytes (EIP-3860);
a bigger deployment fails. `forge build --sizes` shows the margins:

```text
╭----------+------------------+-------------------+--------------------+---------------------╮
| Contract | Runtime Size (B) | Initcode Size (B) | Runtime Margin (B) | Initcode Margin (B) |
+============================================================================================+
| Logbook  | 515              | 543               | 24,061             | 48,609              |
╰----------+------------------+-------------------+--------------------+---------------------╯
```

Split a contract that grows too big into several, or move code into external libraries (lesson
03). Glamsterdam schedules raising the limits to 64 KiB and 128 KiB (EIP-7954); until it ships,
plan for 24 KiB.

## Measuring: reports, snapshots and budgets

`Logbook` keeps readings two ways: `keep` pushes each to a storage array, `announce` only emits
`Reading(msg.sender, value)`. Three calls each, then `forge test --gas-report`:

```text
╭----------------------------------+-----------------+-------+--------+-------+---------╮
| src/Logbook.sol:Logbook Contract |                 |       |        |       |         |
+=======================================================================================+
| Deployment Cost                  | Deployment Size |       |        |       |         |
|----------------------------------+-----------------+-------+--------+-------+---------|
|                           164645 |             543 |       |        |       |         |
|----------------------------------+-----------------+-------+--------+-------+---------|
|                                  |                 |       |        |       |         |
|----------------------------------+-----------------+-------+--------+-------+---------|
| Function Name                    | Min             | Avg   | Median | Max   | # Calls |
|----------------------------------+-----------------+-------+--------+-------+---------|
| announce                         |           23176 | 23176 |  23176 | 23176 |       3 |
|----------------------------------+-----------------+-------+--------+-------+---------|
| keep                             |           48802 | 54502 |  48802 | 65902 |       3 |
|----------------------------------+-----------------+-------+--------+-------+---------|
| readings                         |            4892 |  4892 |   4892 |  4892 |       1 |
╰----------------------------------+-----------------+-------+--------+-------+---------╯
```

The `announce` and `keep` rows include each transaction's 21,000; the `view` call does not. The
first `keep` paid for two fresh slots (the array's length and its first element), the others for
one fresh slot and one change. `forge snapshot` writes each test's gas to `.gas-snapshot`;
committed, `forge snapshot --diff` shows what a change cost and `--check` fails CI when a test
gets more expensive. In a test, assert a **gas budget**, with headroom, instead of an exact number:

```solidity
book.announce(7);
assertLt(vm.lastFrameGas().gasTotalUsed, 25_000, "gas for one announcement");
```

`vm.lastCallGas()` is the older name, deprecated in forge-std 1.17.

## Habits that avoid waste

- Store only what contracts must read later; history for apps belongs in events.
- In loops, read storage into a local variable once and write the result once (Practice 3).
- Use `constant` and `immutable` for fixed values: they live in the code, not in storage.
- Bound every loop over storage: the gas limit will not wait (Advanced 09).

Professional 01 goes further: packing slots, caching and `unchecked`.

## Common mistakes

- **Reading `(gas: N)` as your function's cost.** That figure is the whole test function, with
  deployments and setup calls. Measure the call with `vm.lastFrameGas()`.
- **Using the deprecated cheatcode.** `vm.lastCallGas()` still works but prints `Warning: the
  following cheatcode(s) are deprecated and will be removed in future versions:` followed by
  ``lastCallGas(): replaced by `lastFrameGas` ``. Use `vm.lastFrameGas()`.
- **Unbounded loops.** `fill(100)`, writing 100 fresh slots with 1,000,000 gas, fails with
  `[OutOfGas] EvmError: OutOfGas` in the trace. Cap the work per call.
- **Exact gas assertions.** `assertEq(gasUsed, 23176)` breaks with every compiler or fork
  change. Assert an upper bound.

## Practice

1. A slot holds 3. What does writing 3 to it cost in a fresh transaction?
2. Assert that one `announce` call costs less than 25,000 gas.
3. `addAllSlow` runs `total += xs[i]` on storage for each element. Write `addAllFast` and compare
   both for 100 numbers.

### Answers

1. 2,200: a cold access (2,100) plus a write that changes nothing (100).

```solidity
function addAllFast(uint256[] calldata xs) external {
    uint256 sum = total; // one read
    for (uint256 i = 0; i < xs.length; i++) {
        sum += xs[i];
    }
    total = sum; // one write
}
```

The budget test from the lesson passes, and the comparison prints:

```text
[PASS] test_budget() (gas: 319507)
[PASS] test_slow_versus_fast() (gas: 894994)
Logs:
  slow: 110002
  fast: 88482
```

The slow version pays about 215 gas more per element: a warm read and a dirty write each time.

## Key takeaways

- Storage dominates: a fresh slot costs 22,100 cold, a change 5,000, a warm read 100.
- Cold first access costs 2,100 per slot and 2,600 per address; clearing refunds up to 4,800.
- Memory grows quadratically, calldata is priced per byte, and calls forward at most 63/64.
- Deployed code is limited to 24,576 bytes until Glamsterdam's planned increase ships.
- Measure with gas reports, snapshots and `vm.lastFrameGas()`, and assert budgets, not exact
  numbers.

## Further reading

- [EIP-2929: Gas cost increases for state access opcodes](https://eips.ethereum.org/EIPS/eip-2929)
- [EIP-3529: Reduction in refunds](https://eips.ethereum.org/EIPS/eip-3529)
- [Foundry: Gas tracking](https://getfoundry.sh/forge/gas-tracking)
- [ethereum.org: Gas and fees](https://ethereum.org/en/developers/docs/gas/)
