---
title: Functions and Visibility
summary: Declare functions with parameters and named, multiple returns; choose public, external, internal or private and know that private data is still public on chain; mark functions view, pure or payable; use getters, msg.sender and the constructor; tell internal calls from external ones; and test as another account with vm.prank.
minutes: 35
objectives:
  - Declare functions with parameters, several and named return values, and read multiple results with destructuring
  - Choose each function's visibility and explain why a private variable can still be read by anyone
  - Mark functions view, pure or payable, and fix the compiler errors that the wrong choice causes
  - Use msg.sender and a constructor, tell f() from this.f(), and call a contract as another account with vm.prank
---

## Outline

1. Declaring a function
2. Returning several values
3. Visibility: who may call
4. Private is not secret
5. State mutability: view, pure, payable
6. msg.sender and the constructor
7. Internal and external calls
8. Testing as another account

## Declaring a function

A function declaration lists its name, its typed parameters, its visibility, its state
mutability and the types it returns:

```solidity
/// @title The band rehearsal room above the community hall
contract RehearsalRoom {
    address public immutable caretaker;
    uint256 public immutable hourlyRate;
    address public bookedBy;
    uint256 public bookedHours;
    uint256 private doorCode; // a mistake: private is not secret

    constructor(uint256 rate, uint256 code) {
        caretaker = msg.sender;
        hourlyRate = rate;
        doorCode = code;
    }

    /// @notice What `numHours` hours cost, and the deposit asked for them.
    function quote(uint256 numHours) public view returns (uint256 cost, uint256 deposit) {
        cost = numHours * hourlyRate;
        deposit = _depositFor(cost);
    }

    /// @notice Books the room for the caller and returns the cost.
    function book(uint256 numHours) external returns (uint256 cost) {
        bookedBy = msg.sender;
        bookedHours = numHours;
        (cost,) = quote(numHours);
    }

    function _depositFor(uint256 cost) internal pure returns (uint256) {
        return cost / 4;
    }
}
```

A parameter cannot be called `hours`, a unit keyword: `Expected ',' but got 'hours'`. Hence
`numHours`. Functions with the same name but different parameter types may coexist
(**overloading**); the call's arguments pick one. Use it sparingly, since it confuses readers and
tools.

## Returning several values

A function may return several values. **Named returns** (`returns (uint256 cost, uint256
deposit)`) are local variables that start at zero and are returned when the function ends, so
`quote` needs no `return` statement. `return (a, b);` works too. The caller unpacks the results
by **destructuring**, leaving out the ones it does not need: `(cost,) = quote(numHours);`.

## Visibility: who may call

| Visibility | Called from outside | From this contract | From derived contracts |
| --- | --- | --- | --- |
| `public` | yes | yes | yes |
| `external` | yes | only as `this.f()` | only as `this.f()` |
| `internal` | no | yes | yes |
| `private` | no | yes | no |

Derived contracts are contracts that inherit from this one (Medium 02). Every function must state
its visibility (`No visibility specified. Did you intend to add "public"?`). Make a function
`external` if only users and other contracts call it, `internal` for helpers (by convention named
with a leading `_`), and `public` only when both are needed. Calling a helper from outside does
not compile: `Member "_depositFor" not found or not visible after argument-dependent lookup in
contract RehearsalRoom.` State variables can be `public`, `internal` (the default) or `private`,
never `external`.

A `public` state variable gets an automatic **getter**: `room.bookedBy()` returns the value, and
the ABI lists it as `bookedBy() view returns (address)`.

## Private is not secret

`private` only stops *other contracts* from reading or calling something. Storage is public to
anyone who asks a node, and a test can do the same with the cheatcode `vm.load`, which reads one
32-byte storage slot. `bookedBy` is in slot 0, `bookedHours` in slot 1 and `doorCode` in slot 2
(immutables take no slot):

```solidity
function test_private_is_readable() public view {
    bytes32 raw = vm.load(address(room), bytes32(uint256(2)));
    console.log("door code:", uint256(raw));
}
```

```text
[PASS] test_private_is_readable() (gas: 9173)
Logs:
  door code: 4321
```

On a real chain, `cast storage <address> 2` prints the same slot, in hexadecimal. The value was
also in the deployment transaction's data. Never store a password, key or answer in a contract, private or not.

## State mutability: view, pure, payable

- **view** reads state but does not change it. Calling a view function from outside the chain is
  free, since no transaction is needed.
- **pure** neither reads nor changes state: it uses only its arguments.
- **payable** may receive ether with the call (`msg.value`, lesson 11).
- With no keyword, the function may change state but rejects ether.

The compiler enforces the promise:

```text
Error (8961): Function cannot be declared as view because this expression (potentially) modifies the state.
 --> src/Example.sol:8:9:
  |
8 |         bookedHours = numHours;
  |         ^^^^^^^^^^^
```

```text
Error (2527): Function declared as pure, but this expression (potentially) reads from the environment or state and thus requires "view".
 --> src/Example.sol:8:27:
  |
8 |         return numHours * hourlyRate;
  |                           ^^^^^^^^^^
```

The other way round is only a warning, `Warning (2018): Function state mutability can be
restricted to view`; take it, because callers and tools rely on the label. Sending ether to a
function without `payable` fails: from Solidity it does not compile (`Cannot set option "value" on
a non-payable function type.`), and as a transaction it reverts.

## msg.sender and the constructor

**`msg.sender`** is the address that made the current call: the EOA for a transaction, or the
contract that called this one. It is the basis of every permission check (lesson 10). Its cousin
`tx.origin`, the EOA that started the whole transaction, must never be used for that (lesson 10
says why).

The **constructor** runs once, during deployment, and is not part of the deployed code. Its
`msg.sender` is the deployer, so it is where an owner or caretaker is recorded, and where
immutables are set from its parameters.

## Internal and external calls

A call such as `quote(numHours)` inside the contract is an **internal call**: a jump within the
same code, with the same `msg.sender`. `this.quote(numHours)` is an **external call**: a new
message from the contract to itself, which costs more and changes `msg.sender`. Here a test calls
both as `0xADA`:

```solidity
contract Caller {
    function whoCalls() public view returns (address) {
        return msg.sender;
    }

    function inside() external view returns (address) {
        return whoCalls(); // internal call: same msg.sender
    }

    function throughThis() external view returns (address) {
        return this.whoCalls(); // external call: the contract calls itself
    }
}
```

```text
[PASS] test_who_calls() (gas: 223283)
Logs:
  inside: 0x0000000000000000000000000000000000000aDA
  through this: 0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f
  contract: 0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f
```

An `external` function cannot be called internally at all: `price()` gives `Undeclared
identifier. "price" is not (or not yet) visible at this point.` Make it `public`, or move the
shared logic into an internal helper.

## Testing as another account

In a test, every call comes from the test contract unless you change it. **`vm.prank(addr)`**
makes the *next* call come from `addr`:

```solidity
function test_book_as_ada() public {
    address ada = address(0xADA);
    vm.prank(ada);
    uint256 cost = room.book(3);
    (, uint256 deposit) = room.quote(3);
    console.log("cost:", cost);
    console.log("deposit:", deposit);
    console.log("booked by:", room.bookedBy());
    console.log("caretaker:", room.caretaker());
    assertEq(room.bookedBy(), ada, "the account that booked");
}
```

```text
[PASS] test_book_as_ada() (gas: 112744)
Logs:
  cost: 30000000000000000
  deposit: 7500000000000000
  booked by: 0x0000000000000000000000000000000000000aDA
  caretaker: 0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496
```

The room was deployed with a rate of `0.01 ether`. The caretaker is the test contract, which
deployed the room in `setUp`.

## Common mistakes

- **Marking a writing function `view`.** `Function cannot be declared as view because this
  expression (potentially) modifies the state.` Remove `view`.
- **Storing a secret in a `private` variable.** `vm.load` printed `door code: 4321`. Keep secrets
  off the chain.
- **Using `this.f()` for a helper.** `msg.sender` becomes the contract itself, as the log shows,
  and the call costs more. Call `f()`.
- **Pranking two calls with one `vm.prank`.** Only the next call is pranked; the second comes from
  the test contract again. Prank before each call (Medium 09 shows `vm.startPrank`).

## Practice

1. Write `split(uint256 total, uint256 people)`, returning `each` and `left`, the remainder.
2. Which mutability fits: a function returning `hourlyRate * 2`; one returning `a + b`; one
   recording `msg.sender`?
3. Ada calls `throughThis()`. What does it return, and why?

### Answers

```solidity
/// @notice Splits `total` wei between `people`, and what is left over.
function split(uint256 total, uint256 people) public pure returns (uint256 each, uint256 left) {
    each = total / people;
    left = total - each * people;
}

// in a test:
(uint256 each, uint256 left) = kitty.split(1 ether, 3);
```

```text
[PASS] test_split() (gas: 228710)
Logs:
  each: 333333333333333333
  left: 1
```

2. `view`, `pure`, and the default (no keyword).
3. The contract's own address: `this.whoCalls()` is an external call made by the contract.

## Key takeaways

- A function declares parameters, visibility, mutability and returns; named returns need no
  `return`.
- `external` for outside callers, `internal` for helpers, `public` for both; public state
  variables get getters.
- `private` hides nothing from people: anyone can read storage.
- `view` reads, `pure` computes, `payable` accepts ether, and the compiler checks the promise.
- `msg.sender` is the immediate caller; `this.f()` makes the contract the caller.
- `vm.prank` sets `msg.sender` for the next call only.

## Further reading

- [Solidity documentation: Function visibility and getters](https://docs.soliditylang.org/en/latest/contracts.html#visibility-and-getters)
- [Solidity documentation: Functions (parameters, returns, view and pure)](https://docs.soliditylang.org/en/latest/contracts.html#functions)
- [Solidity documentation: Security considerations, private information](https://docs.soliditylang.org/en/latest/security-considerations.html#private-information-and-randomness)
- [Foundry reference: prank](https://getfoundry.sh/reference/cheatcodes/prank)
