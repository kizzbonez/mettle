---
title: Mappings and Structs
summary: Store values by key in mappings and nested mappings, group fields into structs kept in mappings and arrays, change them through storage references, track state with an enum whose zero value means "missing", list a mapping's keys with an array, and reset data with delete.
minutes: 35
objectives:
  - Read and write mappings and nested mappings, and explain why every key exists, with no length and no iteration
  - Declare structs, store them in mappings and arrays, and change them through a storage reference
  - Model a record's state with an enum whose first member stands for "does not exist"
  - Keep an array of keys to list a mapping, and reset records with delete
---

## Outline

1. Mappings: every key exists
2. Nested mappings
3. Structs in mappings and arrays
4. Change a struct through a storage reference
5. Enums as state, and the zero-value trap
6. Listing a mapping with an array of keys
7. delete

## Mappings: every key exists

A **mapping** stores a value for each key, like a hash map: `mapping(address => uint256)` maps
addresses to numbers. It behaves as if **every key already exists**, holding the zero value of
its type until you write to it. A community tool shed records volunteering credit, and lets a
member allow a friend to collect tools for them:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ToolShed {
    /// @notice Hours of volunteering credit per member.
    mapping(address => uint256) public credits;

    /// @notice How many tools `friend` may collect for `member`: collectAllowance[member][friend].
    mapping(address => mapping(address => uint256)) public collectAllowance;

    function addCredit(address member, uint256 hoursWorked) external {
        credits[member] += hoursWorked;
    }

    function allowCollect(address friend, uint256 tools) external {
        collectAllowance[msg.sender][friend] = tools;
    }
}
```

A test adds 3 and 2 hours for Ada, lets Ada allow Bo two tools, and logs four lookups:

```text
credits of ada: 5
credits of bo:  0
bo may collect for ada: 2
ada may collect for bo: 0
```

Bo was never written, yet `credits(bo)` is 0: a mapping cannot tell "never set" from "set to
zero". It stores only values, at a slot computed from the hash of the key, and keeps no list of
keys, so it has no length, cannot be looped over and lives only in storage:

```text
Error (9582): Member "length" not found or not visible after argument-dependent lookup in mapping(address => uint256).
```

The `public` getter takes the key as a parameter. Keys can be any value type, `string` or
`bytes`; values can be anything, including another mapping.

## Nested mappings

`collectAllowance` is a **nested mapping**: a mapping whose values are mappings.
`collectAllowance[ada][bo]` answers "how much did Ada allow Bo?", and the getter takes both
keys in that order. Token contracts use the same shape for allowances (Medium 04). Note who
writes: `allowCollect` uses `msg.sender` as the first key, so each member can only set their
own allowances. Taking the member as a parameter instead would let anyone grant themselves
someone else's tools.

## Structs in mappings and arrays

A **struct** groups named fields into a new type. Structs go in mappings (a record per id) and
in arrays (a log), and an **enum** (lesson 03) gives each record a state:

```solidity
enum Status {
    Unlisted, // the zero value: what every id that was never listed reads as
    Available,
    OnLoan
}

struct Tool {
    string name;
    Status status;
    address borrower;
    uint256 loans;
}

struct Loan {
    uint256 toolId;
    address borrower;
}

error AlreadyListed(uint256 id);
error NotAvailable(uint256 id, Status status);

mapping(uint256 => Tool) public tools;
uint256[] public toolIds; // the keys, so that the tools can be listed
Loan[] public loanLog;

function list(uint256 id, string memory name) external {
    if (tools[id].status != Status.Unlisted) revert AlreadyListed(id);
    tools[id] = Tool({name: name, status: Status.Available, borrower: address(0), loans: 0});
    toolIds.push(id);
}

function borrow(uint256 id) external {
    Tool storage tool = tools[id]; // a reference: changes are saved
    if (tool.status != Status.Available) revert NotAvailable(id, tool.status);
    tool.status = Status.OnLoan;
    tool.borrower = msg.sender;
    tool.loans += 1;
    loanLog.push(Loan({toolId: id, borrower: msg.sender}));
}
```

`Tool({name: ..., status: ...})` builds a struct with named fields, clearer than values in
order. The getter `tools(id)` returns the fields as a tuple: `(string memory name,
ToolShed.Status status, address borrower, uint256 loans) = shed.tools(9);`.

## Change a struct through a storage reference

`Tool storage tool = tools[id];` makes `tool` a **storage reference**: another name for the
record in the mapping, so every assignment through it is saved. `Tool memory tool = tools[id];`
makes a **memory copy** instead, and changes to it vanish when the function ends:

```solidity
function borrowBroken(uint256 id) external {
    Tool memory tool = tools[id]; // a copy: changes are lost
    tool.status = Status.OnLoan;
    tool.borrower = msg.sender;
}
```

The compiler gives a hint, `Warning (2018): Function state mutability can be restricted to
view`: the function writes nothing. With Ladder (7) and Drill (9) listed, a test calls
`borrowBroken(7)`, then `borrow(9)` as Ada, and logs the records and the first loan:

```text
ladder after borrowBroken: 1
Drill 2 0x00000000000000000000000000000000000A11cE 1
first loan: 9 0x00000000000000000000000000000000000A11cE
```

The ladder is still `Available` (1); the drill is `OnLoan` (2). Lesson 08 explains the data
locations behind this.

## Enums as state, and the zero-value trap

An enum's zero value is its first member, and a record nobody wrote has every field at zero.
That is why `Unlisted` comes first: `tools(42)`, never listed, reads as `Unlisted`, and both
`list` and `borrow` can tell a missing tool from a real one. Put `Available` first instead and
every id that was never listed looks available. With that order, `borrow(99)` succeeds for a
tool that does not exist:

```text
tool 99 borrowed by 0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496 loans: 1
```

When the zero value of a record is meaningful, give the record an explicit "does not exist"
state, or a `bool exists` field, and check it.

## Listing a mapping with an array of keys

To list what a mapping holds, push every new key to an array as `list` does, and loop over the
array. This is the **iterable mapping** pattern:

```solidity
/// @notice The ids of the tools that can be borrowed now.
function availableIds() external view returns (uint256[] memory ids) {
    uint256 count = 0;
    for (uint256 i = 0; i < toolIds.length; i++) {
        if (tools[toolIds[i]].status == Status.Available) count++;
    }
    ids = new uint256[](count);
    uint256 next = 0;
    for (uint256 i = 0; i < toolIds.length; i++) {
        if (tools[toolIds[i]].status == Status.Available) ids[next++] = toolIds[i];
    }
}
```

The loops grow with the number of keys, so cap how many records can be added (lesson 05).

## delete

`delete x` sets `x` back to its zero value. To retire a tool, delete its record and take its id
out of `toolIds` with swap-and-pop (lesson 06):

```solidity
function retire(uint256 id) external {
    if (tools[id].status != Status.Available) revert NotAvailable(id, tools[id].status);
    delete tools[id]; // every field back to its zero value
    for (uint256 i = 0; i < toolIds.length; i++) {
        if (toolIds[i] == id) {
            toolIds[i] = toolIds[toolIds.length - 1];
            toolIds.pop();
            break;
        }
    }
}
```

With Ladder (7), Drill (9) and Saw (4) listed and the drill on loan, a test logs
`availableIds()`, then retires the ladder and logs its record and the ids left:

```text
available: 2 7 4
ladder after retire: 0 0 0
ids kept: 4 9
```

The ladder's name is empty, its status `Unlisted`, its loans 0. A second mapping from id to
position in `toolIds` would remove the key without the loop. Two limits: `delete credits` on a
whole mapping does not compile (`Built-in unary operator delete cannot be applied to type
mapping(address => uint256)`), and deleting a struct that contains a mapping leaves the
mapping's entries in storage.

## Common mistakes

- **Changing a memory copy.** No error, but nothing is saved; the compiler may only warn
  `can be restricted to view`. Use `Tool storage tool = tools[id];`.
- **Trusting the zero value.** A missing key reads as zeros, so an enum that starts with a real
  state makes missing records look real. Start with `None` or `Unlisted`, and check it.
- **Deleting a record but not its key.** `availableIds` would still loop over the id, and a
  listing that shows every key would include an empty record. Remove both.
- **Expecting `.length` or a loop over a mapping.** Error 9582. Keep an array of keys.

## Practice

1. Write `giveBack(uint256 id)`: only the borrower of a tool on loan may give it back (otherwise
   `NotBorrower(id, msg.sender)`); the tool becomes `Available` and its borrower is cleared with
   `delete`.
2. Add `mapping(address => mapping(uint256 => uint256)) public loansBy` (member, then tool id)
   and count each loan in `borrow`.
3. What does `tools(42)` return for an id that was never listed?

### Answers

```solidity
error NotBorrower(uint256 id, address caller);

mapping(address => mapping(uint256 => uint256)) public loansBy; // member => tool id => loans

// in borrow, after tool.loans += 1:
loansBy[msg.sender][id] += 1;

function giveBack(uint256 id) external {
    Tool storage tool = tools[id];
    if (tool.status != Status.OnLoan || tool.borrower != msg.sender) {
        revert NotBorrower(id, msg.sender);
    }
    tool.status = Status.Available;
    delete tool.borrower;
}
```

Ada borrows the drill, gives it back and borrows it again; Bo's `giveBack(9)` reverts with
`NotBorrower(9, 0xB0B)`. Then a test logs the status, borrower, loans and `loansBy(ada, 9)`:

```text
2 0x00000000000000000000000000000000000A11cE 2 2
```

For question 3, a test logs the name's length, status, borrower and loans of `tools(42)`:

```text
0 0 0x0000000000000000000000000000000000000000 0
```

## Key takeaways

- A mapping holds a zero value for every key: no length, no iteration, storage only.
- Nested mappings answer two-key questions; key them by `msg.sender` when callers set their own.
- Structs group fields; build them with named fields and keep them in mappings and arrays.
- Change records through `T storage ref = map[key];`; a `memory` copy changes nothing.
- Give enums a first member meaning "does not exist", and check it.
- Keep an array of keys to list a mapping; `delete` resets a value to zero.

## Further reading

- [Solidity documentation: Mapping types and iterable mappings](https://docs.soliditylang.org/en/latest/types.html#mapping-types)
- [Solidity documentation: Structs](https://docs.soliditylang.org/en/latest/types.html#structs)
- [Solidity documentation: delete](https://docs.soliditylang.org/en/latest/types.html#delete)
- [Solidity documentation: Clearing mappings](https://docs.soliditylang.org/en/latest/security-considerations.html#clearing-mappings)
