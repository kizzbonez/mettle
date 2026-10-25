---
title: Libraries and User-Defined Value Types
summary: Share stateless code in libraries, attach it to types with using for, tell inlined internal library functions from deployed and linked external ones, and give plain numbers their own types and operators so that grams and pence can no longer be mixed up.
minutes: 35
objectives:
  - Write a library with internal functions and call it directly or through using for
  - Explain how an external library function is deployed, linked and run with DELEGATECALL
  - Define a user-defined value type, convert with wrap and unwrap, and attach functions and operators to it
  - Choose between a library, a free function and a constant for a piece of shared code
---

## Outline

1. Libraries: code without state
2. using for
3. External library functions are deployed and linked
4. User-defined value types
5. Operators and functions on your types
6. Free functions and constants

## Libraries: code without state

A **library** is a contract-like unit of reusable functions. It cannot have state variables
(constants are allowed), cannot inherit or be inherited, and cannot receive ether. Money
arithmetic is a typical use: one audited implementation instead of a copy in every contract.

```solidity
/// @notice Shares of an amount in basis points: 10,000 bps is 100%.
library Percent {
    error TooHigh(uint256 bps);

    uint256 internal constant MAX_BPS = 10_000;

    /// @notice `bps` basis points of `amount`, rounded down.
    function share(uint256 amount, uint256 bps) internal pure returns (uint256) {
        if (bps > MAX_BPS) revert TooHigh(bps);
        return (amount * bps) / MAX_BPS;
    }
}

contract TipCalculator {
    using Percent for uint256;

    function tip(uint256 bill) external pure returns (uint256) {
        return bill.share(1_250); // 12.5%, the same as Percent.share(bill, 1_250)
    }

    function custom(uint256 bill, uint256 bps) external pure returns (uint256) {
        return bill.share(bps);
    }
}
```

A test asks for the tip on 0.04 ether, then on 7 wei, then for 125% of 1 ether:

```text
[FAIL: TooHigh(12500 [1.25e4])] test_tips() (gas: 268644)
Logs:
  tip on 0.04 ether: 5000000000000000
  tip on 7 wei: 0
```

`share` is **internal**, so the compiler copies its code into `TipCalculator`: there is no
separate library contract and the call is an ordinary jump. Note the 0: integer division rounds
down, and 12.5% of 7 wei is less than one. Multiply before you divide, as `share` does, or the
precision is lost first (`amount / MAX_BPS * bps` gives 0 for anything under 10,000 wei); Advanced
04 treats rounding in depth. A basis-point library is safer than ad-hoc percentages scattered
through a codebase because the bound check and the rounding rule live in one place.

## using for

`using Percent for uint256;` attaches the library's functions to `uint256`: `bill.share(1_250)`
calls `Percent.share(bill, 1_250)`, the value before the dot becoming the first argument. The
directive applies to the contract (or file) where you write it, not to contracts that inherit
from it. OpenZeppelin's libraries are used this way, such as `using SafeERC20 for IERC20;` in
Medium 11.

## External library functions are deployed and linked

A `public` or `external` library function is not copied. The library is deployed once as its own
contract, and callers reach it with **DELEGATECALL**: the library's code runs in the caller's
context, with the caller's storage, `msg.sender` and balance. A storage parameter lets it write
the caller's state:

```solidity
/// @notice An external library: deployed once, then reused by many contracts.
library Tally {
    function add(mapping(address => uint256) storage totals, address who, uint256 amount) external returns (uint256) {
        totals[who] += amount;
        return totals[who];
    }
}

contract Scoreboard {
    mapping(address => uint256) public points;

    function score(uint256 amount) external returns (uint256) {
        return Tally.add(points, msg.sender, amount);
    }
}
```

`forge test -vvvv` shows the call; forge cannot name a function with a `storage` parameter, so it
prints the selector and the raw arguments:

```text
    ├─ [48690] Scoreboard::score(3)
    │   ├─ [23552] Tally::45d9a522(00000000000000000000000000000000000000000000000000000000000000000000000000000000000000007fa9385be102ac3eac297483dd6233d62b3e14960000000000000000000000000000000000000000000000000000000000000003) [delegatecall]
    │   │   └─ ← [Return] 0x0000000000000000000000000000000000000000000000000000000000000003
    │   └─ ← [Return] 3
```

The three arguments are 32 bytes each: `0`, the test contract's address and `3`. The first is
the mapping: a storage mapping is passed as its slot number, and the library wrote into the
scoreboard's slot 0. The compiled `Scoreboard` does not know where `Tally` will live, so
its bytecode holds a placeholder, `__$633cfd6b6f19c644597e056a844a843831$__` (from `forge inspect
Scoreboard bytecode`), that must be replaced with the library's address before deployment:
**linking**. Forge deploys and links libraries for you in tests and scripts.

External libraries save code size when many contracts share large logic, at the price of a
cross-contract call. Most libraries you write are internal. Calling a deployed library's
state-changing function directly, without DELEGATECALL, reverts: solc adds this **call
protection** because such a call would act on the library's own storage.

## User-defined value types

A `uint256` called `weight` and one called `price` are the same type to the compiler, and
`weight * price` is accepted even when it means nothing. A **user-defined value type** gives a
value type a name of its own:

```solidity
type Grams is uint256;
type Pence is uint256;
```

The new type has the same representation and ABI as `uint256`, but no operators and no
implicit conversions. You convert explicitly: `Grams.wrap(250)` makes a `Grams`, and
`Grams.unwrap(g)` gives the `uint256` back. Mixing types becomes a compile error:

```text
Error (2271): Built-in binary operator * cannot be applied to types Grams and Pence. No matching user-defined operator found.
 --> src/Example.sol:9:16:
  |
9 |         return weight * perGram;
  |                ^^^^^^^^^^^^^^^^
```

Returning a `Grams` where a `uint256` is expected fails too: `Error (6359): Return argument type
Grams is not implicitly convertible to expected type (type of first return variable) uint256.`

## Operators and functions on your types

Without operators, `Grams` would be tedious. A file-level `using ... for Grams global;` attaches
**free functions** (functions written outside any contract) as members and as operators, in every
file that uses the type:

```solidity
type Grams is uint256;

using {add as +, lessThan as <, toKilos} for Grams global;

function add(Grams a, Grams b) pure returns (Grams) {
    return Grams.wrap(Grams.unwrap(a) + Grams.unwrap(b));
}

function lessThan(Grams a, Grams b) pure returns (bool) {
    return Grams.unwrap(a) < Grams.unwrap(b);
}

/// @notice Whole kilograms, rounded down.
function toKilos(Grams g) pure returns (uint256) {
    return Grams.unwrap(g) / 1000;
}

contract Hopper {
    error Overfilled(Grams load, Grams capacity);

    Grams public immutable capacity;
    Grams public load;

    constructor(Grams capacity_) {
        capacity = capacity_;
    }

    function fill(Grams amount) external {
        Grams next = load + amount;
        if (capacity < next) revert Overfilled(next, capacity);
        load = next;
    }
}
```

A 5 kg hopper filled with 1,800 g, then 2,450 g, then 900 g:

```text
[FAIL: Overfilled(5150, 5000)] test_fill() (gas: 368029)
Logs:
  load in grams 4250
  load in kilos 4
```

Operators must be `pure`, take and return the type (comparisons return `bool`), and be defined
`global`, which is only allowed in the file that declares the type. You may define the arithmetic
`+ - * / %`, the bitwise `& | ^ ~`, and the comparisons `== != < <= > >=`; unary `-` needs a
definition of its own. `add` uses checked `+` inside, so overflow still reverts with panic 0x11.

## Free functions and constants

A free function is always internal: it is compiled into each contract that calls it, and it can
reach no contract's state except through its parameters. Use one for small helpers on your own types. Group several related
helpers, or ones you want called as `Lib.f`, in a library. Shared values work the same way: a
file-level `uint256 constant MAX_BPS = 10_000;` or a library holding only constants, such as
`Percent.MAX_BPS`, costs nothing at run time because constants are copied into the code.

## Common mistakes

- **State in a library.** `uint256 count;` in a library: `Error (9957): Library cannot have
  non-constant state variables`. State belongs to the contract; pass it in as a `storage`
  parameter.
- **Forgetting `using for`.** Without it, `bill.share(1_250)` fails with `Error (9582): Member
  "share" not found or not visible after argument-dependent lookup in uint256.` Add the directive
  in that contract, or call `Percent.share(bill, 1_250)`.
- **Operators without `global`.** `using {add as +} for Grams;` gives `Error (3320): Operators can
  only be defined in a global 'using for' directive.`
- **Dividing before multiplying.** `amount / 10_000 * bps` rounds every amount under 10,000 wei
  down to zero before the share is taken.

## Practice

1. Add `shareUp` to `Percent`, which rounds up instead (for amounts a user must pay).
2. Define `type Pence is uint256;` with `+` and `==`, and check that 120p + 85p equals 205p.
3. What happens when `addPence(Pence.wrap(type(uint256).max), Pence.wrap(1))` runs?

### Answers

```solidity
function shareUp(uint256 amount, uint256 bps) internal pure returns (uint256) {
    if (bps > MAX_BPS) revert TooHigh(bps);
    return (amount * bps + MAX_BPS - 1) / MAX_BPS;
}

type Pence is uint256;

using {addPence as +, equalPence as ==} for Pence global;

function addPence(Pence a, Pence b) pure returns (Pence) {
    return Pence.wrap(Pence.unwrap(a) + Pence.unwrap(b));
}

function equalPence(Pence a, Pence b) pure returns (bool) {
    return Pence.unwrap(a) == Pence.unwrap(b);
}
```

The test logs `7.share(1_250)` and `7.shareUp(1_250)`, then the comparison; the third question
runs as a test of its own:

```text
[PASS] test_answers() (gas: 9315)
Logs:
  down: 0 up: 1
  total == 205p: true

[FAIL: panic: arithmetic underflow or overflow (0x11)] test_overflow() (gas: 428)
```

## Key takeaways

- Libraries hold stateless, reusable code; internal functions are copied in, external ones are
  deployed once, linked and reached by DELEGATECALL in the caller's context.
- `using L for T` lets you write `x.f(y)` for `L.f(x, y)`.
- A user-defined value type is a distinct name for a value type: mixing it up is a compile error.
- Operators come from pure free functions in a `global` using-for directive.
- Multiply before dividing, and keep rounding rules in one library.

## Further reading

- [Solidity documentation: Libraries](https://docs.soliditylang.org/en/latest/contracts.html#libraries)
- [Solidity documentation: Using For](https://docs.soliditylang.org/en/latest/contracts.html#using-for)
- [Solidity documentation: User-defined value types](https://docs.soliditylang.org/en/latest/types.html#user-defined-value-types)
- [Solidity by Example: Library](https://solidity-by-example.org/library/)
