---
title: Events and NatSpec
summary: Record what happened with events that apps and indexers read, choose indexed parameters, test emitted events with vm.expectEmit and vm.recordLogs, and document a contract's public interface with NatSpec.
minutes: 35
objectives:
  - Declare and emit an event with up to three indexed parameters, and explain what goes into topics and what into data
  - Test that a call emits the expected event with vm.expectEmit, and read raw logs with vm.recordLogs
  - Decide what belongs in storage and what in an event, knowing that contracts cannot read logs
  - Document public functions with NatSpec tags and read the userdoc and devdoc that the compiler produces
---

## Outline

1. Why events exist
2. Declaring, emitting and testing an event
3. Topics and data
4. Reading raw logs with vm.recordLogs
5. NatSpec: documentation the compiler understands

## Why events exist

A wallet showing "you claimed plot 7" or a website listing every claim needs the history of
what a contract did, but storage holds only the current state.

An **event** is a record that a contract writes into the transaction's **log**. Logs are kept in
the transaction's receipt, tied to the emitting contract's address; programs off the chain query
them from a node and subscribe to new ones, and **indexers** turn them into databases for apps.
Logs cost far less than storage because they are not part of the state the EVM keeps at hand.
The price: no contract can read them, not even the one that wrote them. So keep what the
contract needs for later decisions in storage, and emit what the outside world needs to know.

Here is the difference in gas for keeping the same note (lesson 06's arrays) both ways:

```solidity
string[] public notes;
event NotePosted(address indexed author, string text);

function postToStorage(string calldata text) external {
    notes.push(text);
}

function postAsEvent(string calldata text) external {
    emit NotePosted(msg.sender, text);
}
```

`forge test --gas-report`, posting a 53-character note each way (the figures include the 21,000
gas every transaction pays):

```text
| Function Name                           | Min             | Avg    | Median | Max    | # Calls |
|-----------------------------------------+-----------------+--------+--------+--------+---------|
| postAsEvent                             |           25279 |  25279 |  25279 |  25279 |       1 |
|-----------------------------------------+-----------------+--------+--------+--------+---------|
| postToStorage                           |          112038 | 112038 | 112038 | 112038 |       1 |
```

## Declaring, emitting and testing an event

Declare an event with `event Name(parameters);` in the contract (or at file level), and write
it with `emit Name(arguments);`. By convention the name is a past-tense fact: `PlotClaimed`,
`Deposited`. Emit after the state has changed, at the end of the function. If the call reverts
later, the log is thrown away with every other change, so an event only ever describes
something that really happened.

forge-std's **`vm.expectEmit`** tests events. Call it, then `emit` the event you expect, then
make the call: the call must emit a matching event, or the test fails. Passing an address,
`vm.expectEmit(address(plots))`, also checks which contract emitted it. Since Solidity 0.8.21
a test can emit the contract's own event as `GardenPlots.PlotClaimed(...)`; older tests
declare a copy of the event in the test contract.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";

contract GardenPlots {
    mapping(uint256 => address) public holderOf;

    event PlotClaimed(uint256 indexed plotId, address indexed gardener, string crop);

    error PlotTaken(uint256 plotId, address holder);

    function claim(uint256 plotId, string calldata crop) external {
        address holder = holderOf[plotId];
        if (holder != address(0)) revert PlotTaken(plotId, holder);
        holderOf[plotId] = msg.sender;
        emit PlotClaimed(plotId, msg.sender, crop);
    }
}

contract GardenPlotsTest is Test {
    GardenPlots plots = new GardenPlots();
    address ada = address(0xA11CE);

    function test_claim_emits_PlotClaimed() public {
        vm.expectEmit(address(plots));
        emit GardenPlots.PlotClaimed(7, ada, "beans");
        vm.prank(ada);
        plots.claim(7, "beans");
    }

    function test_expects_the_wrong_gardener() public {
        vm.expectEmit(address(plots));
        emit GardenPlots.PlotClaimed(7, address(this), "beans");
        vm.prank(ada);
        plots.claim(7, "beans");
    }
}
```

```text
[PASS] test_claim_emits_PlotClaimed() (gas: 61696)
[FAIL: PlotClaimed param mismatch at gardener: expected=0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496, got=0x00000000000000000000000000000000000A11cE] test_expects_the_wrong_gardener() (gas: 61577)
```

The second test expected the test contract as gardener, but `vm.prank` made Ada the caller,
and forge names the parameter that differs. `vm.expectEmit()` without arguments checks every
topic and the data; in `vm.expectEmit(true, false, true, true)` the four flags stand for topics
1 to 3 and the data, and a `false` skips that part, for values a test cannot predict.

## Topics and data

A log has up to four **topics**, 32-byte values that nodes can filter on, and a **data** part
holding the rest, ABI-encoded. Topic 0 is the keccak256 hash of the event's signature,
`PlotClaimed(uint256,address,string)`, available as `GardenPlots.PlotClaimed.selector`. Every
parameter marked **`indexed`** takes one of the other three topics, so an event can have at most
three. An app asking "every claim by this gardener" filters on topic 2 without reading the rest.

Index the values people search by: ids and addresses. A string, `bytes` or array that is
indexed is stored as its keccak256 hash, which can be matched but never turned back into the
text. Leave such values unindexed when apps must display them. An event declared **`anonymous`**
has no signature topic: it is slightly cheaper and allows four indexed parameters, but apps
can no longer filter it by name, so it is rarely used.

## Reading raw logs with vm.recordLogs

`vm.recordLogs()` starts recording; `vm.getRecordedLogs()` returns every log since then as
`Vm.Log` structs with `topics`, `data` and `emitter`. Use it when you want to inspect the raw
log, count events, or decode values you could not predict:

```solidity
function test_read_the_raw_log() public {
    vm.recordLogs();
    plots.claim(7, "beans");
    Vm.Log[] memory entries = vm.getRecordedLogs();

    assertEq(entries.length, 1, "number of logs");
    assertEq(entries[0].emitter, address(plots), "the emitting contract");
    assertEq(entries[0].topics[0], GardenPlots.PlotClaimed.selector, "topic 0");
    console.log("topics:", entries[0].topics.length);
    console.log("plotId:", uint256(entries[0].topics[1]));
    console.log("gardener:", address(uint160(uint256(entries[0].topics[2]))));
    console.log("crop:", abi.decode(entries[0].data, (string)));
}
```

```text
[PASS] test_read_the_raw_log() (gas: 75619)
Logs:
  topics: 3
  plotId: 7
  gardener: 0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496
  crop: beans
```

Import `Vm` alongside `Test` and `console` for the struct. `abi.decode` turns data back into
values; Medium 06 explains the encoding.

## NatSpec: documentation the compiler understands

**NatSpec** comments start with `///` (or `/** ... */`) right above a contract, function,
event or error. `@notice` tells a user what something does, `@dev` tells developers and
auditors the details, `@param name` describes a parameter and `@return` a return value.
Wallets can show a function's notice before a user signs, and auditors compare what the
comments promise with what the code does. The compiler checks the tags and collects them into
two JSON documents:

```solidity
/// @title Garden plot register
/// @notice Gardeners claim numbered plots; each plot has one holder at a time.
contract GardenPlots {
    /// @notice Claim a free plot for yourself.
    /// @dev Reverts with PlotTaken if the plot is held. The crop is kept only in the event.
    /// @param plotId The plot to claim.
    /// @param crop What you plan to grow.
    function claim(uint256 plotId, string calldata crop) external {
```

`forge inspect GardenPlots devdoc` (the `userdoc` holds the two notices):

```json
{
  "version": 1,
  "kind": "dev",
  "methods": {
    "claim(uint256,string)": {
      "details": "Reverts with PlotTaken if the plot is held. The crop is kept only in the event.",
      "params": {
        "crop": "What you plan to grow.",
        "plotId": "The plot to claim."
      }
    }
  },
  "title": "Garden plot register"
}
```

Comments on internal functions are allowed but left out of both documents. Give every public
function a notice, and use `@dev` for what a reviewer must know: when it reverts, what it emits.

## Common mistakes

- **Indexing four parameters.** `Error (7249): More than 3 indexed arguments for event.` Index
  the ids and addresses people filter by and leave the rest in the data.
- **Forgetting the `emit`.** A function that changes state but emits nothing leaves apps blind,
  and `vm.expectEmit` reports `[FAIL: log != expected log]`. Test every event you promise.
- **Indexing a string that apps must show.** The topic holds `keccak256("beans")` and the data
  holds nothing, so the crop name is lost. Leave strings unindexed.
- **A `@param` that names no parameter.** `Error (3881): Documented parameter "plot" not found
  in the parameter list of the function.` Rename the tag when you rename the parameter.
- **Expecting the contract to read its events.** There is no way to read a log on chain. Keep
  anything a later call needs, such as who holds a plot, in storage.

## Practice

1. Add `release(uint256 plotId)` to `GardenPlots`: only the holder may call it (otherwise revert
   `NotHolder(plotId, msg.sender)`); it frees the plot and emits
   `PlotReleased(uint256 indexed plotId, address indexed gardener)`.
2. Test that the holder's release emits the event and frees the plot.
3. Document `release` with `@notice`, `@dev` and `@param`.
4. How many topics does a `PlotReleased` log have, and how long is its data?

### Answers

```solidity
event PlotReleased(uint256 indexed plotId, address indexed gardener);
error NotHolder(uint256 plotId, address caller);

/// @notice Give up a plot you hold, so that someone else can claim it.
/// @dev Reverts with NotHolder unless the caller holds the plot; emits PlotReleased.
/// @param plotId The plot to give up.
function release(uint256 plotId) external {
    if (holderOf[plotId] != msg.sender) revert NotHolder(plotId, msg.sender);
    delete holderOf[plotId];
    emit PlotReleased(plotId, msg.sender);
}

// in the test contract
function test_holder_releases() public {
    vm.prank(ada);
    plots.claim(7, "beans");

    vm.recordLogs();
    vm.expectEmit(address(plots));
    emit GardenPlots.PlotReleased(7, ada);
    vm.prank(ada);
    plots.release(7);

    Vm.Log[] memory entries = vm.getRecordedLogs();
    assertEq(entries[0].topics.length, 3, "topics of PlotReleased");
    assertEq(entries[0].data.length, 0, "bytes of data in PlotReleased");
    assertEq(plots.holderOf(7), address(0), "holder after the release");
}
```

```text
[PASS] test_holder_releases() (gas: 96899)
```

Three topics (the signature, `plotId`, `gardener`) and zero bytes of data: both parameters are
indexed.

## Key takeaways

- Events record history for the outside world; they cost far less than storage, and no contract
  can read them.
- Emit after the state change; a revert discards the log with everything else.
- Topic 0 is the signature hash; up to three `indexed` parameters become topics; indexed strings
  are only hashes.
- Test events with `vm.expectEmit(emitter)` followed by the expected `emit`; use
  `vm.recordLogs` to inspect raw logs.
- NatSpec (`@notice`, `@dev`, `@param`, `@return`) documents the interface for users and
  auditors, and the compiler checks it.

## Further reading

- [Solidity documentation: Events](https://docs.soliditylang.org/en/latest/contracts.html#events)
- [Solidity documentation: NatSpec Format](https://docs.soliditylang.org/en/latest/natspec-format.html)
- [Foundry reference: expectEmit](https://getfoundry.sh/reference/cheatcodes/expect-emit/)
- [Foundry reference: recordLogs](https://getfoundry.sh/reference/cheatcodes/record-logs/)
