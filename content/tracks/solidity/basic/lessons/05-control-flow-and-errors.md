---
title: Control Flow and Errors
summary: Branch with if, else and the ternary, write loops knowing that every pass costs gas, stop a call with revert, require and custom errors, tell errors from panics, and test every failure with vm.expectRevert.
minutes: 35
objectives:
  - Write if/else chains, ternaries and bounded loops, and explain why a loop's cost grows with its passes
  - Reject bad input with custom errors through revert and require, carrying the values that explain the failure
  - Tell an error from a panic, and use assert only for conditions that can never be false
  - Test each way a function fails with vm.expectRevert and an exact selector, encoded error, string or stdError value
---

## Outline

1. Branches: if, else and the ternary
2. Loops, and why every pass costs gas
3. Stopping a call: revert and custom errors
4. require, with a custom error or a string
5. Panics and assert
6. A revert undoes the whole call
7. Testing reverts with vm.expectRevert

## Branches: if, else and the ternary

`if`, `else if` and `else` work as in C or JavaScript, and the **ternary operator**
`condition ? a : b` picks one of two values. But a condition must be a `bool`; nothing converts to
one by itself, so `if (seatsLeft)` with a `uint256` does not compile:

```text
Error (7407): Type uint256 is not implicitly convertible to expected type bool.
 --> src/Example.sol:8:13:
  |
8 |         if (seatsLeft) {
  |             ^^^^^^^^^
```

Write the comparison you mean: `if (seatsLeft > 0)`. A ferry's fare table:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Ferry {
    uint256 public constant ADULT_FARE = 0.004 ether;

    /// @notice The fare for one passenger of the given age.
    function fareFor(uint256 age) public pure returns (uint256) {
        if (age < 5) {
            return 0; // small children travel free
        } else if (age < 16) {
            return ADULT_FARE / 2;
        } else {
            return age >= 65 ? (ADULT_FARE * 3) / 4 : ADULT_FARE;
        }
    }
}
```

A test logging the fares for four ages prints them in wei:

```text
Logs:
  age 3:  0
  age 12: 2000000000000000
  age 40: 4000000000000000
  age 70: 3000000000000000
```

`(ADULT_FARE * 3) / 4` multiplies before dividing, so integer division loses nothing. There is
no `switch`: an `else if` chain is the idiom.

## Loops, and why every pass costs gas

`for`, `while`, `do ... while`, `break` and `continue` behave as you expect. What is new is the
price: every operation costs gas, so a loop costs more with every pass. Two ways to board
passengers:

```solidity
uint256 public seatsLeft = 1000;

/// @dev Wasteful: one storage write per passenger.
function boardOneByOne(uint256 passengers) external {
    for (uint256 i = 0; i < passengers; i++) {
        seatsLeft -= 1;
    }
}

/// @dev One subtraction, whatever the number of passengers.
function board(uint256 passengers) external {
    seatsLeft -= passengers;
}
```

A test measured each call with `gasleft()` (Medium 07 covers measuring gas):

```text
Logs:
  loop,   10 passengers: 31769
  loop,  100 passengers: 76209
  plain,  10 passengers: 29959
  plain, 100 passengers: 29962
```

Each figure includes the 21,000 gas every transaction pays up front (forge runs each call in a
test as its own transaction). The loop adds about 490 gas per passenger; the subtraction costs
the same for 10 as for 100. Use arithmetic when you can, and never loop over something that
grows without limit, such as a list anyone can add to: a block has a gas limit, so once the list
is long enough the function can never succeed again (Advanced 09 shows the attack). Give every
loop a small maximum that you check.

## Stopping a call: revert and custom errors

When a call cannot do what was asked, it **reverts**: it stops, undoes its changes and returns
**revert data** saying why. The clearest revert data is a **custom error**, declared with `error`
and raised with the `revert` statement:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Ferry {
    error NoSeatsRequested();
    error NotEnoughSeats(uint256 available, uint256 requested);

    address public immutable captain;
    uint256 public seatsLeft = 40;

    constructor() {
        captain = msg.sender;
    }

    /// @notice Books `seats` seats on the next crossing.
    function book(uint256 seats) external {
        if (seats == 0) revert NoSeatsRequested();
        require(seats <= seatsLeft, NotEnoughSeats(seatsLeft, seats));
        seatsLeft -= seats;
    }

    function cancelCrossing() external {
        require(msg.sender == captain, "only the captain");
        seatsLeft = 0;
    }
}
```

The arguments say what went wrong in numbers: 40 seats left, 50 asked for. The revert data is a
four-byte **selector** (the start of the keccak256 hash of `NotEnoughSeats(uint256,uint256)`)
followed by the arguments, far shorter than a sentence. Tests that call `book(50)`, `book(0)`
and, through `vm.prank`, `cancelCrossing()` show how forge reports each revert:

```text
[FAIL: only the captain] test_stranger_cancels() (gas: 29773)
[FAIL: NotEnoughSeats(40, 50)] test_too_many() (gas: 29637)
[FAIL: NoSeatsRequested()] test_zero() (gas: 27112)
```

## require, with a custom error or a string

`require(condition, ...)` reverts when the condition is false:

- `require(cond, NotEnoughSeats(seatsLeft, seats))` reverts with the custom error, exactly like
  `if (!cond) revert NotEnoughSeats(...)`. This form needs Solidity 0.8.27 or later.
- `require(cond, "only the captain")` reverts with a **revert string**, the built-in error
  `Error(string)`. The whole sentence is stored in the contract and returned.
- `require(cond)` reverts with no data: a test shows `[FAIL: EvmError: Revert]`.

Prefer custom errors. `require` evaluates its error's arguments even when the condition holds,
so pass plain values, not function calls.

## Panics and assert

A **panic** is the built-in error `Panic(uint256)`, raised when the code itself goes wrong:

| Code | Cause |
| --- | --- |
| 0x01 | `assert` with a false condition |
| 0x11 | arithmetic overflow or underflow (lesson 03) |
| 0x12 | division or modulo by zero |
| 0x31, 0x32 | `pop()` on an empty array, an index out of bounds (lesson 06) |

With `seatsPerCar(uint256 cars)` returning `seatsLeft / cars`, and a booking function that checks
its input with `assert(seats <= seatsLeft)`:

```text
[FAIL: panic: assertion failed (0x01)] test_assert_panic() (gas: 29223)
[FAIL: panic: division or modulo by zero (0x12)] test_division_panic() (gas: 8077)
```

`assert` takes no message. Keep it for an **invariant**, a fact that is false only if your
contract has a bug ("seats sold never exceed capacity"). Correct code never panics: check input
with `require` or `revert`.

## A revert undoes the whole call

A revert rolls back every change the call made, in this contract and any it called; only the
gas spent up to the revert is gone. This `depart` changes `crossings`, then reverts; a test below
finds `crossings` still 0:

```solidity
function depart() external {
    crossings += 1;
    if (seatsLeft == 40) revert NoSeatsRequested();
    seatsLeft = 40;
}
```

Put the checks first anyway: a failing call then wastes less gas, and once functions send ether
(lesson 11) the order of checks, changes and payments is what keeps funds safe.

## Testing reverts with vm.expectRevert

`vm.expectRevert(...)` says that the **next call** must revert with exactly the data you give:

```solidity
function test_error_without_arguments() public {
    vm.expectRevert(Ferry.NoSeatsRequested.selector);
    ferry.book(0);
}

function test_error_with_arguments() public {
    vm.expectRevert(abi.encodeWithSelector(Ferry.NotEnoughSeats.selector, 40, 50));
    ferry.book(50);
}

function test_panic() public {
    vm.expectRevert(stdError.divisionError);
    ferry.seatsPerCar(0);
}

function test_revert_undoes_everything() public {
    vm.expectRevert(Ferry.NoSeatsRequested.selector);
    ferry.depart();
    assertEq(ferry.crossings(), 0, "crossings after a reverted departure");
}

function test_wrong_arguments() public {
    vm.expectRevert(abi.encodeWithSelector(Ferry.NotEnoughSeats.selector, 50, 40));
    ferry.book(50);
}
```

```text
[PASS] test_error_with_arguments() (gas: 33553)
[PASS] test_error_without_arguments() (gas: 30128)
[PASS] test_panic() (gas: 12035)
[PASS] test_revert_undoes_everything() (gas: 57146)
[FAIL: Error != expected error: NotEnoughSeats(40, 50) != NotEnoughSeats(50, 40)] test_wrong_arguments() (gas: 33521)
```

Pass `.selector` for an error without arguments, `abi.encodeWithSelector(selector, args...)` for
one with arguments (it builds the bytes the contract returns; Medium 06 explains the encoding),
and the sentence itself for a revert string: `vm.expectRevert("only the captain")`. forge-std's
`stdError` holds the panics: `arithmeticError`, `divisionError`, `indexOOBError` and more.

## Common mistakes

- **Expecting only the selector of an error that has arguments.** The test fails with `Error !=
  expected error: NotEnoughSeats(40, 50) != custom error 0xc4ed54c8`. Encode the arguments, or
  use `vm.expectPartialRevert(Ferry.NotEnoughSeats.selector)` when they do not matter.
- **A call between `vm.expectRevert` and the call you mean.** In
  `ferry.book(ferry.seatsLeft() + 1)` the getter runs first, so it is the next call: `next call
  did not revert as expected`. Read the value into a local variable before `vm.expectRevert`.
- **Checking input with `assert`.** The caller gets `panic: assertion failed (0x01)`, which looks
  like a bug. Use `require` with a custom error.

## Practice

1. Write `crossingsNeeded(uint256 passengers)`: how many 40-seat crossings carry everyone, without
   a loop; revert with `NoSeatsRequested()` for 0.
2. Add `error TooManyCars(uint256 cars, uint256 max)`, `MAX_CARS = 12` and `boardCars(uint256
   cars)`, which refuses a boarding that would take `carsAboard` over 12. Test that 10 cars and
   then 3 more revert with `TooManyCars(13, 12)` and leave 10 aboard.
3. A test calls `vm.expectRevert(abi.encodeWithSelector(Ferry.NotEnoughSeats.selector, 40, 0))`
   and then `ferry.book(0)`. Does it pass?

### Answers

```solidity
uint256 public constant SEATS_PER_CROSSING = 40;
uint256 public constant MAX_CARS = 12;
uint256 public carsAboard;

function crossingsNeeded(uint256 passengers) public pure returns (uint256) {
    if (passengers == 0) revert NoSeatsRequested();
    return (passengers + SEATS_PER_CROSSING - 1) / SEATS_PER_CROSSING;
}

function boardCars(uint256 cars) external {
    require(carsAboard + cars <= MAX_CARS, TooManyCars(carsAboard + cars, MAX_CARS));
    carsAboard += cars;
}

function test_too_many_cars() public {
    ferry.boardCars(10);
    vm.expectRevert(abi.encodeWithSelector(Ferry.TooManyCars.selector, 13, 12));
    ferry.boardCars(3);
    assertEq(ferry.carsAboard(), 10, "cars aboard after the refused boarding");
}
```

With a test of 1, 40 and 81 passengers (1, 1 and 3 crossings), and question 3's test:

```text
[PASS] test_crossings() (gas: 20532)
[FAIL: Error != expected error: NoSeatsRequested() != NotEnoughSeats(40, 0)] test_predict() (gas: 31044)
[PASS] test_too_many_cars() (gas: 82504)
```

Adding 39 before dividing rounds up. Question 3 fails: `book` checks for zero first. The order of
your checks is part of what callers see.

## Key takeaways

- Conditions must be `bool`; an `else if` chain or a ternary replaces `switch`.
- Every loop pass costs gas: prefer arithmetic, and bound every loop.
- Revert with custom errors carrying the values behind the failure, through `revert` or
  `require(cond, Error(...))` (0.8.27+).
- Panics mean a bug; `assert` is only for invariants.
- A revert undoes the call's changes, but the gas is still spent.
- `vm.expectRevert` checks the next call's exact revert data.

## Further reading

- [Solidity documentation: Error handling with assert, require and revert](https://docs.soliditylang.org/en/latest/control-structures.html#error-handling-assert-require-revert-and-exceptions)
- [Solidity documentation: Custom errors](https://docs.soliditylang.org/en/latest/contracts.html#custom-errors)
- [Foundry reference: expectRevert](https://getfoundry.sh/reference/cheatcodes/expect-revert)
