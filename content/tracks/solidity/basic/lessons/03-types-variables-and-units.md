---
title: Types, Variables and Units
summary: Use Solidity's value types (bool, integers of every size, address, fixed-size bytes, enums), see checked arithmetic revert with panic 0x11, write amounts and durations with units, fix values with constant and immutable, and convert between types knowing what truncates.
minutes: 35
objectives:
  - Choose between bool, uint8 to uint256, int types, address, address payable, bytes1 to bytes32 and enums, and state each default value
  - Predict when checked arithmetic reverts with panic 0x11, and widen values before adding them
  - Write amounts with ether, gwei and wei and durations with time units, and declare constant and immutable values
  - Convert between integer, bytes and address types, and say which conversions truncate
---

## Outline

1. Value types and their defaults
2. Checked arithmetic and panic 0x11
3. unchecked, in one paragraph
4. Addresses
5. Literals and units
6. constant, immutable and ordinary state variables
7. Conversions and what truncates

## Value types and their defaults

Solidity is statically typed: every variable has a type, fixed when you write the code.

- **bool**: `true` or `false`, with `!`, `&&` and `||` (which short-circuit).
- **Unsigned integers** `uint8`, `uint16`, ... `uint256`, in steps of 8 bits; `uint` is `uint256`.
  **Signed integers** `int8` to `int256`. There are no floating-point numbers: amounts are whole
  numbers of a small unit, such as wei.
- **address**: 20 bytes that identify an account.
- **bytes1** to **bytes32**: a fixed number of raw bytes, such as a 32-byte hash.
- **enum**: a type with named values, stored as a small number starting at 0.

`type(T).max` and `type(T).min` give a type's limits. Variables that you do not assign start at
their **default value**: zero, `false`, the zero address, zero bytes, the first enum member. There
is no `null` and no "undefined". This lesson prints from a Foundry **script**, whose `run()`
Foundry executes locally (Medium 12 covers scripts):

```solidity
enum Stage {
    Sown,
    Sprouted,
    Harvested
}

function run() public pure {
    console.log("uint8 max:", type(uint8).max);
    console.log("uint256 max:", type(uint256).max);
    console.log("int8 min:", type(int8).min);

    bool done;
    uint256 count;
    address who;
    bytes4 tag;
    Stage stage;
    console.log("defaults:", done, count, who);
    console.logBytes4(tag);
    console.log("stage:", uint8(stage), "max stage:", uint8(type(Stage).max));
}
```

```text
uint8 max: 255
uint256 max: 115792089237316195423570985008687907853269984665640564039457584007913129639935
int8 min: -128
defaults: false 0 0x0000000000000000000000000000000000000000
0x00000000
stage: 0 max stage: 2
```

Defaults matter for security: an `address` nobody set is `address(0)`, which no one controls, so
ether sent there is lost for good. Use `uint256` unless you have a reason for a smaller type
(Professional 01 packs small types to save gas).

## Checked arithmetic and panic 0x11

Since 0.8.0, arithmetic is **checked**: a result that does not fit its type does not wrap around,
it reverts with a **panic**, error code `0x11`, and the whole transaction is undone.

```solidity
contract SeedTray {
    uint8 public seedlings = 250;

    function plant(uint8 more) public {
        seedlings = seedlings + more;
    }
}

// in a test:
tray.plant(5);
console.log("after planting 5:", tray.seedlings());
tray.plant(1);
```

```text
[FAIL: panic: arithmetic underflow or overflow (0x11)] test_a_full_tray() (gas: 271564)
Logs:
  after planting 5: 255
```

Subtraction below zero on an unsigned type, `3 - 5`, is an **underflow** and panics the same way.
Integer division rounds toward zero (`7 / 2` is 3), so multiply before you divide: `7 / 2 * 10`
is 30 but `7 * 10 / 2` is 35. Dividing by zero panics with `0x12`.

The type of a sum is the type of its operands, not the variable it is stored in. Here
`morning + afternoon` is computed as a `uint8`, so it overflows before it is widened:

```solidity
function badTotal(uint8 morning, uint8 afternoon) public pure returns (uint16) {
    uint16 sum = morning + afternoon; // added as uint8, then widened
    return sum;
}

function total(uint8 morning, uint8 afternoon) public pure returns (uint16) {
    return uint16(morning) + afternoon; // widened first, then added as uint16
}

function wrapped(uint8 x) public pure returns (uint8) {
    unchecked {
        return x + 1;
    }
}
```

Tests call `total(200, 100)` and `wrapped(255)`, then `badTotal(200, 100)`:

```text
[PASS] test_widen_first() (gas: 19823)
Logs:
  total: 300
  unchecked 255 + 1: 0

[FAIL: panic: arithmetic underflow or overflow (0x11)] test_widen_too_late() (gas: 6413)
```

(`pure` means the function uses only its inputs; lesson 04 explains it.)

## unchecked, in one paragraph

Inside an `unchecked { ... }` block, arithmetic wraps around instead of reverting: `255 + 1` in a
`uint8` is `0`, as the log above shows. It saves a little gas and is only correct when you have
proved that wrapping cannot happen, such as a loop counter that stops far below the limit.
Professional 01 uses it that way; until then, leave arithmetic checked.

## Addresses

`address` holds an account; `address(this)` is the current contract and `address(0)` the zero
address. **`address payable`** is the same 20 bytes with two extra members, `transfer` and `send`,
which are deprecated: lesson 11 pays with `call`, which every address has. You still meet
`address payable` in older code, and an `address` does not become one by itself:

```text
Error (9574): Type address is not implicitly convertible to expected type address payable.
 --> src/Example.sol:6:9:
  |
6 |         address payable p = who;
  |         ^^^^^^^^^^^^^^^^^^^^^^^
```

Convert explicitly with `payable(who)`.

## Literals and units

Number literals may use `_` as a separator (`1_000_000`) and scientific notation (`2e18`). A
literal alone has no fixed type until it is used, which is why lesson 02 wrote `uint256(1 ether)`.

**Ether units** turn a literal into wei: `1 wei` is 1, `1 gwei` is 10^9 and `1 ether` is 10^18, so
`0.02 ether` is 20000000000000000. **Time units** turn it into seconds: `seconds`, `minutes`,
`hours`, `days` and `weeks` (`2 days` is 172800). There is no `years`, since years differ in
length. Units apply only to literals: `d days` fails with `Expected ';' but got 'days'`; write
`d * 1 days`.

## constant, immutable and ordinary state variables

```solidity
contract Allotment {
    uint256 public constant PLOT_FEE = 0.02 ether; // fixed when compiled
    uint256 public constant WATER_EVERY = 2 days;
    address public immutable secretary; // fixed when deployed
    uint256 public immutable openedAt;
    uint256 public plotsLet; // an ordinary state variable, in storage

    constructor(uint256 openingTime) {
        secretary = msg.sender;
        openedAt = openingTime;
    }

    function wateringDay(uint256 n) public view returns (uint256) {
        uint256 due = openedAt + n * WATER_EVERY; // a local variable
        return due;
    }
}
```

- A **constant** is fixed in the source. `uint256 constant OPENED = block.timestamp;` fails with
  `Initial value for constant variable has to be compile-time constant.`
- An **immutable** is set once, in the **constructor** (the code that runs once, at deployment;
  lesson 04), and never again. Assigning it in a function fails with `Cannot write to immutable
  here`.
- An ordinary **state variable** lives in storage and can change. A **local variable** such as
  `due` exists only during the call.

Constants and immutables are copied into the bytecode, so reading them skips storage. In a test,
Foundry's gas report shows the difference:

```text
| Function Name                         | Min             | Avg  | Median | Max  | # Calls |
| PLOT_FEE                              |             413 |  413 |    413 |  413 |       1 |
| plotsLet                              |            2468 | 2468 |   2468 | 2468 |       1 |
| secretary                             |             373 |  373 |    373 |  373 |       1 |
```

## Conversions and what truncates

**Implicit** conversions happen only when nothing can be lost: `uint8` to `uint256`, `bytes4` to
`bytes32`. Everything else must be **explicit**, and an explicit conversion to a smaller type
**truncates silently**. Integers keep their lowest bits; `bytesN` values keep their leftmost bytes:

```solidity
uint256 big = 300;
uint16 code = 0x1234;
int8 minusOne = -1;
bytes2 pair = 0x1234;
console.log("uint8(300):", uint8(big));
console.log("uint8(0x1234):", uint8(code));
console.log("uint8(int8(-1)):", uint8(minusOne));
console.logBytes1(bytes1(pair));
```

```text
uint8(300): 44
uint8(0x1234): 52
uint8(int8(-1)): 255
0x12
```

None of these reverts: 300 became 44 (300 − 256). A conversion may change only one thing at a
time, so `int8(x)` for a `uint256` fails with `Explicit type conversion not allowed from "uint256"
to "int8".`; write `int8(int256(x))`, which turns 200 into -56. Before narrowing a value that
came from a user, check that it fits (`x <= type(uint8).max`), or a 300-ticket order becomes 44.

## Common mistakes

- **Adding small types into a larger variable.** `uint16 sum = a + b;` with `uint8` operands
  reverts with `panic: arithmetic underflow or overflow (0x11)` for 200 + 100. Widen first:
  `uint16(a) + b`.
- **A literal too big for its type.** `uint8 x = 300;` fails with `Type int_const 300 is not
  implicitly convertible to expected type uint8. Literal is too large to fit in uint8.`
- **Trusting a narrowing conversion.** `uint8(big)` gives 44 for 300 without any error. Check the
  range first.
- **Units on a variable.** `d days` does not compile; write `d * 1 days`.

## Practice

1. What is `uint8(x)` for `uint256 x = 1000`?
2. Declare constants for a 90-minute lesson and a 0.5 gwei tip. What are their values?
3. Fix `uint16 sum = a + b;` for `uint8 a = 200` and `uint8 b = 100`.

### Answers

```solidity
uint256 constant LESSON = 90 minutes;
uint256 constant TIP = 0.5 gwei;

function run() public pure {
    uint256 thousand = 1000;
    console.log("uint8(1000):", uint8(thousand));
    console.log("90 minutes:", LESSON);
    console.log("0.5 gwei:", TIP);

    uint8 a = 200;
    uint8 b = 100;
    uint16 sum = uint16(a) + b;
    console.log("sum:", sum);
}
```

```text
uint8(1000): 232
90 minutes: 5400
0.5 gwei: 500000000
sum: 300
```

1000 is 3 × 256 + 232, and truncation keeps the remainder.

## Key takeaways

- Integers come in sizes from 8 to 256 bits; unassigned variables are zero, `false` or
  `address(0)`.
- Overflow and underflow revert with panic 0x11; the operands' type decides where it happens.
- `unchecked` wraps, and is for proven cases only.
- Units: `1 ether` is 10^18 wei, `1 days` is 86400 seconds, and only literals take them.
- `constant` is fixed at compile time, `immutable` at deployment; both skip storage.
- Narrowing conversions truncate silently: check the range first.

## Further reading

- [Solidity documentation: Types](https://docs.soliditylang.org/en/latest/types.html)
- [Solidity documentation: Units and globally available variables](https://docs.soliditylang.org/en/latest/units-and-global-variables.html)
- [Solidity documentation: Constant and immutable state variables](https://docs.soliditylang.org/en/latest/contracts.html#constant-and-immutable-state-variables)
- [Solidity documentation: Checked or unchecked arithmetic](https://docs.soliditylang.org/en/latest/control-structures.html#checked-or-unchecked-arithmetic)
