---
title: Testing with Foundry
summary: Organise a Foundry suite around a setUp fixture and names that state behaviour, control callers, ether, time and dependencies with cheatcodes, expect exact reverts and events, fuzz with bound and inline settings, and find untested branches with forge coverage.
minutes: 40
objectives:
  - Build a test contract with a setUp fixture, labelled actors from makeAddr and test names that state one behaviour each
  - Control the caller, ether, time and a dependency with prank, startPrank, hoax, deal, warp and mockCall
  - Expect an exact custom error and event, and explain why a bare vm.expectRevert() lets bugs through
  - Write a bounded fuzz test with an inline run count, and read forge coverage to find untested branches
---

## Outline

1. A suite is the specification
2. The fixture: setUp, makeAddr and label
3. Callers, ether and exact expectations
4. Time and dependencies: warp, roll and mockCall
5. Fuzzing with bound and inline configuration
6. Coverage, gas snapshots and writing the test first

## A suite is the specification

Earlier lessons used cheatcodes one at a time. A contract that will hold other people's money
needs a whole **test suite**: one contract that inherits `Test` per contract or per feature
(`RoomBookingTest`), with fixtures shared through an abstract base contract when several suites
need them. Each function name states one behaviour: `test_Cancel_RefundsTheDeposit`,
`test_RevertWhen_CancelOneSecondLate`, `testFuzz_` for fuzz tests. Read from top to bottom,
the names are the contract's specification.

Every test function starts from a fresh copy of the state `setUp` left, so tests never depend
on each other or on their order. Within a test, Foundry **isolates** each top-level call as its
own transaction by default, as on a real chain (transient storage is cleared between them).
Old tutorials name reverting tests `testFail...`; Foundry 1.x refuses them:

```text
[FAIL: `testFail*` has been removed. Consider changing to test_Revert[If|When]_Condition and expecting a revert] testFail_old() (gas: 0)
```

## The fixture: setUp, makeAddr and label

The example: members book a rehearsal room for a day with a deposit and may cancel, for a full
refund, until 24 hours before the day. Membership lives in another contract.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IMembership {
    function isMember(address who) external view returns (bool);
}

contract RoomBooking {
    uint256 public constant DEPOSIT = 0.05 ether;
    IMembership public immutable membership;
    mapping(uint256 day => address) public bookedBy; // day = timestamp / 1 days

    event Booked(uint256 indexed day, address indexed member);

    error NotMember(address who);
    error WrongDeposit(uint256 sent);
    error AlreadyBooked(uint256 day);
    error NotYourBooking(uint256 day, address caller);
    error TooLateToCancel(uint256 day);
    error RefundFailed();

    constructor(IMembership membership_) {
        membership = membership_;
    }

    function book(uint256 day) external payable {
        if (!membership.isMember(msg.sender)) revert NotMember(msg.sender);
        if (msg.value != DEPOSIT) revert WrongDeposit(msg.value);
        if (bookedBy[day] != address(0)) revert AlreadyBooked(day);
        bookedBy[day] = msg.sender;
        emit Booked(day, msg.sender);
    }

    function cancel(uint256 day) external {
        if (bookedBy[day] != msg.sender) revert NotYourBooking(day, msg.sender);
        if (block.timestamp > day * 1 days - 1 days) revert TooLateToCancel(day);
        delete bookedBy[day];
        (bool ok,) = msg.sender.call{value: DEPOSIT}("");
        if (!ok) revert RefundFailed();
    }
}
```

The **fixture** is what every test starts from. `makeAddr("alice")` derives an address from a
name and **labels** it, so traces print `alice` next to the hex; `vm.label` names any other
address:

```solidity
contract RoomBookingTest is Test {
    uint256 constant DAY = 20_000; // the day that starts at 20000 * 1 days
    RoomBooking room;
    address registry = makeAddr("registry");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    event Booked(uint256 indexed day, address indexed member);

    function setUp() public {
        // Every address is a member unless a test says otherwise.
        vm.mockCall(registry, abi.encodeWithSelector(IMembership.isMember.selector), abi.encode(true));
        room = new RoomBooking(IMembership(registry));
        vm.label(address(room), "room");
        vm.warp(DAY * 1 days - 3 days); // three days before the booked day
    }
```

## Callers, ether and exact expectations

```solidity
    function test_Book_RecordsAndEmits() public {
        vm.expectEmit(address(room));
        emit Booked(DAY, alice);
        hoax(alice, 1 ether); // deal(alice, 1 ether) + prank(alice)
        room.book{value: 0.05 ether}(DAY);
        assertEq(room.bookedBy(DAY), alice, "who booked the day");
    }

    function test_Cancel_RefundsTheDeposit() public {
        vm.deal(alice, 1 ether);
        vm.startPrank(alice); // alice makes every call until stopPrank
        room.book{value: 0.05 ether}(DAY);
        room.cancel(DAY);
        vm.stopPrank();
        assertEq(alice.balance, 1 ether, "alice's balance after the refund");
    }

    function test_RevertWhen_SomeoneElseCancels() public {
        hoax(alice, 1 ether);
        room.book{value: 0.05 ether}(DAY);
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(RoomBooking.NotYourBooking.selector, DAY, bob));
        room.cancel(DAY);
    }
```

`vm.prank` sets `msg.sender` for the next call only, just as `vm.expectRevert` applies to the
next call; `vm.startPrank` lasts until `vm.stopPrank`.
`vm.deal` sets a balance, and **`hoax`** (from forge-std) does a deal and a prank in one line.
Expect the **exact** error, with its arguments, and name the emitter in `vm.expectEmit`, which
by default checks every topic and the data. With `-vvvv`, the labels make the trace readable:

```text
    ├─ [0] VM::prank(bob: [0x1D96F2f6BeF1202E4Ce1Ff6Dad0c2CB002861d3e])
    │   └─ ← [Return]
    ├─ [0] VM::expectRevert(NotYourBooking(20000 [2e4], 0x1D96F2f6BeF1202E4Ce1Ff6Dad0c2CB002861d3e))
    │   └─ ← [Return]
    ├─ [24217] room::cancel(20000 [2e4])
    │   └─ ← [Revert] NotYourBooking(20000 [2e4], 0x1D96F2f6BeF1202E4Ce1Ff6Dad0c2CB002861d3e)
```

## Time and dependencies: warp, roll and mockCall

Test both sides of every deadline: the last second that is allowed and the first that is not.
`vm.warp` sets `block.timestamp`, `vm.roll` sets `block.number`, and forge-std's `skip(n)` and
`rewind(n)` move time relative to now. **`vm.mockCall`** makes an address answer a call with
whatever you choose, so a test can control a dependency without deploying it. A mock with full
calldata wins over a selector-only one, and an address without code gets one byte of code so that
calls reach it.

```solidity
    function test_RevertWhen_CancelOneSecondLate() public {
        vm.deal(alice, 1 ether);
        vm.startPrank(alice);
        room.book{value: 0.05 ether}(DAY);
        vm.warp(DAY * 1 days - 1 days + 1); // test_Cancel_AtTheLastSecond warps to - 1 days
        vm.expectRevert(abi.encodeWithSelector(RoomBooking.TooLateToCancel.selector, DAY));
        room.cancel(DAY);
        vm.stopPrank();
    }

    function test_RevertWhen_NotAMember() public {
        vm.mockCall(registry, abi.encodeCall(IMembership.isMember, (bob)), abi.encode(false));
        hoax(bob, 1 ether);
        vm.expectRevert(abi.encodeWithSelector(RoomBooking.NotMember.selector, bob));
        room.book{value: 0.05 ether}(DAY);
    }
```

Mocks last until `vm.clearMockedCalls()`; `vm.mockCallRevert` makes a call fail instead.

## Fuzzing with bound and inline configuration

Prefer `bound`, which maps any input into a range, to `vm.assume`, which throws inputs away: too
many rejections fail the test. `vm.assume` suits excluding a single value, as here. A `forge-config` comment right above a test changes its settings:

```solidity
    /// forge-config: default.fuzz.runs = 1000
    function testFuzz_RevertWhen_WrongDeposit(uint256 sent) public {
        sent = bound(sent, 0, 10 ether);
        vm.assume(sent != room.DEPOSIT()); // excludes the one right amount
        hoax(alice, sent);
        vm.expectRevert(abi.encodeWithSelector(RoomBooking.WrongDeposit.selector, sent));
        room.book{value: sent}(DAY);
    }
}
```

```text
Ran 7 tests for test/RoomBooking.t.sol:RoomBookingTest
[PASS] testFuzz_RevertWhen_WrongDeposit(uint256) (runs: 1000, μ: 50824, ~: 50465)
[PASS] test_Book_RecordsAndEmits() (gas: 75098)
[PASS] test_Cancel_AtTheLastSecond() (gas: 98602)
[PASS] test_Cancel_RefundsTheDeposit() (gas: 98104)
[PASS] test_RevertWhen_CancelOneSecondLate() (gas: 94596)
[PASS] test_RevertWhen_NotAMember() (gas: 48145)
[PASS] test_RevertWhen_SomeoneElseCancels() (gas: 95593)
Suite result: ok. 7 passed; 0 failed; 0 skipped; finished in 81.89ms (80.36ms CPU time)
```

## Coverage, gas snapshots and writing the test first

`forge coverage` runs the suite and reports which lines, statements, **branches** (each side of
every `if`) and functions ran. For these seven tests:

```text
| File                | % Lines         | % Statements   | % Branches   | % Funcs       |
+=======================================================================================+
| src/RoomBooking.sol | 100.00% (13/13) | 89.47% (17/19) | 66.67% (4/6) | 100.00% (3/3) |
```

Every line ran, yet two branches never did: no test books a taken day, and none refuses a
refund. `--report lcov` writes `lcov.info` for an editor to highlight. Coverage tells you what
ran, not what was checked: a test without assertions covers lines too. The real measure is
whether a test fails when the code is wrong, which this lesson's lab checks.

`forge snapshot` (lesson 07) records each test's gas in `.gas-snapshot`; `forge snapshot
--check` fails when gas changes, a cheap guard in continuous integration.

**Test-driven development** turns the requirement into a failing test first, then writes just
enough code to pass it, then tidies up with the tests as a safety net. For contracts it forces
you to decide every error and boundary before the code exists.

## Common mistakes

- **A bare `vm.expectRevert()`.** It accepts any failure. Bob, without ether, books a taken day:
  the bare test passes, and would pass even without the `AlreadyBooked` check. The exact one
  shows the truth: `[FAIL: Error != expected error: EvmError: OutOfFunds != AlreadyBooked(20000 [2e4])]`.
  Fund every actor and expect the exact error.
- **A prank used up by a getter.** `vm.prank(alice); room.book{value: room.DEPOSIT()}(DAY);`
  pranks the `DEPOSIT()` call, so the test contract books:
  `[FAIL: who booked the day: 0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496 != 0x328809Bc894f92807417D2dAD6b7C998c1aFdac6]`.
  Read values into locals before the prank.
- **`vm.assume` for a range.** `vm.assume(sent > 1 ether && sent < 2 ether)` fails with
  ``[FAIL: `vm.assume` rejected too many inputs (65536 allowed)]``. Use `bound`.
- **Expecting an event after the call.** `vm.expectEmit` must come before the call that emits:
  `[FAIL: expected an emit, but no logs were emitted afterwards. you might have mismatched events or not enough events were emitted]`.

## Practice

1. Write `test_RevertWhen_DayAlreadyBooked`, with both members funded.
2. Write `test_RevertWhen_RefundIsRefused`: the test contract has no `receive` function.
3. Fuzz: cancelling at any moment from now until the cutoff refunds the whole deposit.

### Answers

```solidity
    function test_RevertWhen_DayAlreadyBooked() public {
        hoax(alice, 1 ether);
        room.book{value: 0.05 ether}(DAY);
        hoax(bob, 1 ether);
        vm.expectRevert(abi.encodeWithSelector(RoomBooking.AlreadyBooked.selector, DAY));
        room.book{value: 0.05 ether}(DAY);
    }

    function test_RevertWhen_RefundIsRefused() public {
        room.book{value: 0.05 ether}(DAY); // the test contract books and cannot be refunded
        vm.expectRevert(RoomBooking.RefundFailed.selector);
        room.cancel(DAY);
    }

    function testFuzz_Cancel_RefundsUntilTheCutoff(uint256 moment) public {
        uint256 cutoff = DAY * 1 days - 1 days;
        moment = bound(moment, block.timestamp, cutoff);
        hoax(alice, 1 ether);
        room.book{value: 0.05 ether}(DAY);
        vm.warp(moment);
        vm.prank(alice);
        room.cancel(DAY);
        assertEq(alice.balance, 1 ether, "alice's balance after cancelling");
    }
```

```text
[PASS] testFuzz_Cancel_RefundsUntilTheCutoff(uint256) (runs: 256, μ: 100911, ~: 101019)
[PASS] test_RevertWhen_DayAlreadyBooked() (gas: 105671)
[PASS] test_RevertWhen_RefundIsRefused() (gas: 99191)
```

With them, `forge coverage` reports `100.00% (6/6)` branches.

## Key takeaways

- One suite per contract or feature, a `setUp` fixture, and names that state one behaviour each.
- `makeAddr` and `vm.label` name actors; `prank`, `startPrank`, `deal` and `hoax` control callers
  and ether; `warp` and `roll` control time; `mockCall` controls dependencies.
- Expect exact errors and name the emitter; a bare `expectRevert()` passes for the wrong reason.
- Fuzz with `bound`; set runs inline with `/// forge-config: default.fuzz.runs = N`.
- Coverage finds what never ran; only a failing test on broken code proves a test checks something.

## Further reading

- [Foundry: Writing tests](https://getfoundry.sh/forge/tests/overview)
- [Foundry: Fuzz testing](https://getfoundry.sh/forge/fuzz-testing)
- [Foundry cheatcodes: expectRevert](https://getfoundry.sh/reference/cheatcodes/expect-revert)
- [Foundry cheatcodes: mockCall](https://getfoundry.sh/reference/cheatcodes/mock-call)
