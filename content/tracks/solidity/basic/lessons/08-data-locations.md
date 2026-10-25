---
title: "Data Locations: storage, memory and calldata"
summary: Know where data lives and what it costs, tell a storage reference from a memory copy by the assignment rules, take external parameters as calldata, keep per-transaction state in transient storage, and read a contract's storage layout with forge inspect.
minutes: 35
objectives:
  - Predict whether an assignment copies data or creates a reference, for every pair of storage, memory and calldata
  - Find and fix the bug of changing a memory copy of a struct that was meant to change storage
  - Take external array and string parameters as calldata, and explain why it is cheaper and read-only
  - Use a transient state variable for per-transaction state, and read slots with forge inspect storageLayout
---

## Outline

1. Where data lives
2. Copies and references: the assignment rules
3. calldata for external parameters
4. Transient storage
5. Reading the storage layout

## Where data lives

Value types (`uint256`, `address`, `bool`...) in a function live on the EVM's stack and need no
keyword. Arrays, structs, `string` and `bytes` are **reference types**, and every variable of
one has a **data location**:

| Location | Lifetime | Writable | Cost |
| --- | --- | --- | --- |
| `storage` | for ever: the contract's state | yes | the highest: writing a new slot costs about 20,000 gas |
| `memory` | one function call | yes | a few gas per 32-byte word, more as memory grows |
| `calldata` | one call: the input sent with it | no | the cheapest to read; nothing is copied |
| `transient` | one transaction | yes | 100 gas to read or write a value |

State variables are in storage (or transient storage). A local variable or parameter of a
reference type must name `memory`, `storage` or `calldata`; leave it out and the compiler
stops: `Data location must be "memory" or "calldata" for parameter in external function, but
none was given.`

## Copies and references: the assignment rules

Whether an assignment copies the data or only makes a second name for it depends on the two
locations:

| Assignment | Result |
| --- | --- |
| storage to a local `storage` variable | reference |
| memory to memory | reference |
| storage or calldata to memory | independent copy |
| memory or calldata to storage | independent copy |
| anything to a state variable, even from storage | independent copy |

A greenhouse tracks its beds:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Greenhouse {
    struct Bed {
        string crop;
        uint256 waterings;
    }

    Bed[] public beds;
    Bed public lastRemoved;

    constructor() {
        beds.push(Bed({crop: "tomato", waterings: 0}));
        beds.push(Bed({crop: "basil", waterings: 0}));
    }

    /// @dev The classic bug: `bed` is a copy, so the count in storage never changes.
    function waterCopy(uint256 i) external {
        Bed memory bed = beds[i];
        bed.waterings += 1;
    }

    /// @dev `bed` refers to the element in storage: the change is saved.
    function water(uint256 i) external {
        Bed storage bed = beds[i];
        bed.waterings += 1;
    }

    /// @dev Assigning to a state variable copies, even from storage.
    function archive(uint256 i) external {
        lastRemoved = beds[i];
        beds[i].waterings = 99;
    }

    /// @dev Memory to memory only copies the reference.
    function aliasDemo() external pure returns (uint256, uint256) {
        uint256[] memory a = new uint256[](1);
        uint256[] memory b = a;
        b[0] = 7;
        return (a[0], b[0]);
    }
}
```

A test calls `waterCopy(0)`, `water(1)` and `archive(1)`, logging the waterings after each step,
then `aliasDemo()`:

```text
tomato 0 basil 1
archived copy 1 basil now 99
a[0] 7 b[0] 7
```

`waterCopy` runs without an error and changes nothing. The only clue is
`Warning (2018): Function state mutability can be restricted to view`: on a function meant to
change state, treat it as a bug report. `archive` made a real copy, so `lastRemoved` kept 1, and
`b = a` gave two names for one memory array.

Parameters follow the same rules: an internal function taking `Bed storage bed` changes the
caller's bed, one taking `Bed memory bed` gets a copy. And never keep a storage reference to an
array element across a `pop()`: it is left **dangling**, and writing through it is undefined
behaviour.

## calldata for external parameters

**calldata** is the read-only input of the call. An `external` function can take its arrays and
strings as `calldata` and read them where they are; `memory` makes the function copy the whole
input first. Summing 50 numbers both ways:

```solidity
function totalMemory(uint256[] memory litres) external pure returns (uint256 total) {
    for (uint256 i = 0; i < litres.length; i++) {
        total += litres[i];
    }
}

function totalCalldata(uint256[] calldata litres) external pure returns (uint256 total) {
    for (uint256 i = 0; i < litres.length; i++) {
        total += litres[i];
    }
}

/// @dev Slices work on calldata arrays only: everything after the first reading.
function totalAfterFirst(uint256[] calldata litres) external view returns (uint256) {
    return this.totalCalldata(litres[1:]);
}
```

A test passes the readings 0 to 49 and measures each call with `gasleft()`:

```text
memory:   41585
calldata: 32429
after the first: 1225
```

Copying 50 words cost about 9,000 gas. A **slice** `litres[1:]` exists only for calldata arrays.
Calldata is read-only: `litres[0] = 0;` fails with `Error (6182): Calldata arrays are
read-only.` To change the input, copy it: `uint256[] memory copy = litres;`.

## Transient storage

A **transient** state variable (Solidity 0.8.28 and later, EVM version cancun or newer) is
stored like a state variable but cleared at the end of every transaction. It suits state that
matters only during one transaction, such as a lock or a counter, and costs 100 gas per read or
write (EIP-1153). A sprinkler may run at most twice per transaction:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Sprinkler {
    uint256 public totalRuns; // storage: kept for ever
    uint256 transient runsThisTx; // transient: back to 0 after every transaction

    error TooManyRuns(uint256 limit);

    /// @notice Runs the sprinkler, at most twice in one transaction.
    function run() external {
        if (runsThisTx == 2) revert TooManyRuns(2);
        runsThisTx += 1;
        totalRuns += 1;
    }
}

/// @notice Calls `run` several times inside one transaction.
contract Batch {
    function runTimes(Sprinkler s, uint256 times) external {
        for (uint256 i = 0; i < times; i++) {
            s.run();
        }
    }
}
```

A test calls `batch.runTimes(s, 2)` twice, then `batch.runTimes(s, 3)`, expecting
`TooManyRuns(2)`:

```text
total runs: 4
total runs after the refused batch: 4
```

The second batch was a new transaction, so it started from 0. The third reverted, and a revert
undoes transient writes like any others. Only value types can be transient, they cannot be
initialised where they are declared, and they cannot be `constant` or `immutable`. Never keep
in transient storage anything that a later transaction needs.

## Reading the storage layout

Each state variable has a **slot**, a numbered 32-byte place in storage, assigned in
declaration order. `forge inspect Greenhouse storageLayout` shows them for a contract with
`address gardener; bool open; uint256 temperature; Bed[] beds; mapping(address => uint256)
visits; string name;` and one transient `uint256 runsThisTx`:

```text
╭-------------+-----------------------------+------+--------+-------+----------------------------╮
| Name        | Type                        | Slot | Offset | Bytes | Contract                   |
+================================================================================================+
| gardener    | address                     | 0    | 0      | 20    | src/Example.sol:Greenhouse |
|-------------+-----------------------------+------+--------+-------+----------------------------|
| open        | bool                        | 0    | 20     | 1     | src/Example.sol:Greenhouse |
|-------------+-----------------------------+------+--------+-------+----------------------------|
| temperature | uint256                     | 1    | 0      | 32    | src/Example.sol:Greenhouse |
|-------------+-----------------------------+------+--------+-------+----------------------------|
| beds        | struct Greenhouse.Bed[]     | 2    | 0      | 32    | src/Example.sol:Greenhouse |
|-------------+-----------------------------+------+--------+-------+----------------------------|
| visits      | mapping(address => uint256) | 3    | 0      | 32    | src/Example.sol:Greenhouse |
|-------------+-----------------------------+------+--------+-------+----------------------------|
| name        | string                      | 4    | 0      | 32    | src/Example.sol:Greenhouse |
╰-------------+-----------------------------+------+--------+-------+----------------------------╯
```

`gardener` and `open` share slot 0 (packing is Professional 01). Slot 2 holds only the array's
length: the elements start at the slot given by `keccak256(2)`. Slot 3 stays empty: each value
of `visits` lives at a slot hashed from its key and 3. `forge inspect Greenhouse
transientStorageLayout` lists `runsThisTx` at slot 0 of its own, separate space. Every slot is
public on chain, `private` included.

## Common mistakes

- **Changing a memory copy.** No error, no change; only `Warning (2018): Function state
  mutability can be restricted to view`. Use `storage` for a local that should change state.
- **Leaving out the location.** Error 6651. Write `calldata` for external inputs you only read,
  `memory` otherwise.
- **Writing to calldata.** `Calldata arrays are read-only.` Copy to memory first.
- **Expecting transient values to last.** In the next transaction they read 0. Use storage for
  anything that must persist.

## Practice

1. Fix `waterCopy` so that the count is saved.
2. Write `rename(uint256 i, string calldata crop)`, which sets a bed's crop.
3. What does this return, with `beds[0].waterings` at 1?
   `Bed memory snapshot = beds[0]; beds[0].waterings = 5; return (snapshot.waterings, beds[0].waterings);`

### Answers

```solidity
function waterCopy(uint256 i) external {
    Bed storage bed = beds[i]; // was `Bed memory`
    bed.waterings += 1;
}

function rename(uint256 i, string calldata crop) external {
    beds[i].crop = crop; // calldata to storage: a copy
}

function snapshotThenWater() external returns (uint256 before, uint256 later) {
    Bed memory snapshot = beds[0];
    beds[0].waterings = 5;
    return (snapshot.waterings, beds[0].waterings);
}
```

A test calls `waterCopy(0)` and `rename(0, "chilli")`, logs bed 0, then logs
`snapshotThenWater()`:

```text
chilli 1
1 5
```

The snapshot was copied into memory before the write, so it keeps the old count.

## Key takeaways

- `storage` lasts, `memory` lasts one call, `calldata` is read-only input, `transient` lasts one
  transaction.
- Storage to a local `storage` variable, and memory to memory, are references; all else copies.
- Change state through `storage` references; heed warning 2018.
- Take external inputs you only read as `calldata`: no copy, less gas.
- `forge inspect <Contract> storageLayout` shows every slot, and every slot is public.

## Further reading

- [Solidity documentation: Data location and assignment behaviour](https://docs.soliditylang.org/en/latest/types.html#data-location-and-assignment-behavior)
- [Solidity documentation: Transient storage](https://docs.soliditylang.org/en/latest/contracts.html#transient-storage)
- [Solidity documentation: Layout of state variables in storage](https://docs.soliditylang.org/en/latest/internals/layout_in_storage.html)
- [EIP-1153: Transient storage opcodes](https://eips.ethereum.org/EIPS/eip-1153)
