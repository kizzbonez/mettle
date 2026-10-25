---
title: Interfaces and Calling Other Contracts
summary: Call other contracts through interfaces and contract types, create contracts with new and send them ether, see how a callee's revert bubbles up, catch failures with try/catch, and stay safe when a contract calls you back.
minutes: 35
objectives:
  - Declare an interface and call a deployed contract through it, converting between addresses and contract types
  - Create contracts with new, pass ether to their constructors, and say who msg.sender is inside them
  - Predict when a callee's error bubbles up and handle failures with every form of try/catch
  - Treat external calls and callbacks as untrusted code, updating state before handing over control
---

## Outline

1. Contract types and addresses
2. Calling through an interface
3. Creating contracts with new
4. Errors bubble up
5. try/catch
6. Contracts that call back
7. CREATE2 in one paragraph

## Contract types and addresses

Real systems are many contracts calling each other: a shop calls a token, a vault calls a price
feed. On the chain, another contract is just an address. In Solidity you give that address a
**contract type**, which tells the compiler which functions live there, so that `feed.price()`
type-checks like a method call in any language.

`IThermometer(addr)` turns an address into a contract type and `address(t)` turns it back. Neither
checks anything: the compiler trusts you that such code lives at `addr`.

## Calling through an interface

An **interface** lists the functions another contract offers, without their bodies. Interfaces
cannot have implemented functions, a constructor, state variables or modifiers; every function is
`external`. They may declare events, errors, structs and enums, and may inherit other interfaces.
A contract that has the functions can say so with `is IThermometer` (lesson 02 covers `is`), and
the compiler then checks that it implements them all.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice What a weather station needs from any thermometer.
interface IThermometer {
    function celsius() external view returns (int256);
}

contract Thermometer is IThermometer {
    int256 private reading;

    constructor(int256 start) {
        reading = start;
    }

    function celsius() external view returns (int256) {
        return reading;
    }
}

contract WeatherStation {
    IThermometer public immutable thermometer;

    constructor(IThermometer thermometer_) {
        thermometer = thermometer_;
    }

    function isFreezing() external view returns (bool) {
        return thermometer.celsius() <= 0;
    }
}
```

A test deploys `new Thermometer(-3)`, passes it to the station and logs:

```text
  thermometer at 0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f
  station sees 0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f
  freezing? true
```

`WeatherStation` needs only the interface, not `Thermometer`'s code: any contract with a matching
`celsius()` works. `thermometer.celsius()` is an
**external call**: a message from one contract to another, with the function and its arguments
encoded in the call data (Medium 06 shows the bytes). Calling a `view` function uses `STATICCALL`,
so the callee cannot change any state.

The trust has limits. Point the station at `0xBEEF`, an address with no code, and `isFreezing()`
reverts; forge's trace (`-vvvv`) says why:

```text
    ├─ [2971] WeatherStation::isFreezing() [staticcall]
    │   ├─ [0] 0x000000000000000000000000000000000000bEEF::celsius() [staticcall]
    │   │   └─ ← [Stop]
    │   └─ ← [Revert] call to non-contract address 0x000000000000000000000000000000000000bEEF
```

The call itself "succeeds" with no data, and decoding an `int256` from nothing reverts in the
station. `addr.code.length` is the size of the code at an address, so checking that it is above
zero catches such addresses early. But code can be the wrong code: never trust an arbitrary
address, because whoever deployed it decides what your call runs.

## Creating contracts with new

`new C(args)` deploys a fresh contract and returns it as type `C`. The creating contract must know
`C`'s full code at compile time. Ether goes along with `{value: ...}`, and the constructor must be
`payable`. A contract that deploys others is called a **factory**:

```solidity
contract Escrow {
    address public immutable buyer;
    address public immutable seller;

    constructor(address seller_) payable {
        buyer = msg.sender; // who is msg.sender here?
        seller = seller_;
    }
}

contract EscrowFactory {
    Escrow[] public escrows;

    function open(address seller) external payable returns (Escrow escrow) {
        escrow = new Escrow{value: msg.value}(seller);
        escrows.push(escrow);
    }
}
```

Alice calls `open{value: 0.25 ether}(bob)`:

```text
  escrow balance 250000000000000000
  alice   0x328809Bc894f92807417D2dAD6b7C998c1aFdac6
  factory 0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f
  buyer   0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f
```

The ether arrived, but the buyer is the factory. Inside a constructor, `msg.sender` is whoever
deployed the contract, and here that is `EscrowFactory`. Pass the real user in as an argument.

## Errors bubble up

When a callee reverts, its error **bubbles up**: the caller reverts with the same error data, and
the whole transaction is undone, the caller's own changes included.

```solidity
interface IBooth {
    function sell(uint256 tickets) external returns (uint256 left);
}

contract Booth is IBooth {
    error SoldOut(uint256 left, uint256 wanted);

    uint256 public left = 2;

    function sell(uint256 tickets) external returns (uint256) {
        require(tickets > 0, "no tickets requested");
        if (tickets > left) revert SoldOut(left, tickets);
        left -= tickets;
        return left;
    }
}

contract Agent {
    function buy(IBooth booth, uint256 tickets) external returns (uint256) {
        return booth.sell(tickets);
    }
}
```

A test calling `agent.buy(booth, 5)` fails with the booth's error, raised one contract deeper:

```text
[FAIL: SoldOut(2, 5)] test_buy_bubbles() (gas: 35924)
```

## try/catch

Bubbling is the safe default. When one failing contract must not stop yours, a payout to many
recipients or a reading from one of several feeds, catch the failure with **try/catch**. It works
only on external calls and `new`:

```solidity
function tryBuy(IBooth booth, uint256 tickets) external returns (bool) {
    try booth.sell(tickets) returns (uint256 left) {
        console.log("bought, left:", left);
        return true;
    } catch Error(string memory reason) {
        console.log("reason:", reason); // revert("...") and require(..., "...")
    } catch Panic(uint256 code) {
        console.log("panic code:", code); // overflow, division by zero, assert
    } catch (bytes memory data) {
        console.log("SoldOut?", bytes4(data) == Booth.SoldOut.selector);
    }
    return false;
}
```

Buying 1, then 0, then 5 tickets (`console.log` is forge-std's testing aid, for the demo only):

```text
  bought, left: 1
  reason: no tickets requested
  SoldOut? true
```

Custom errors land in the `bytes` clause; their first four bytes are the error's **selector**
(`Booth.SoldOut.selector`). A bare `catch { ... }` catches everything without the data. When a catch
block runs, the callee's changes are already undone. Two things are not caught: errors in your own
code, including decoding the return value (`tryBuy` on `0xBEEF` still reverts with
`EvmError: Revert`), and errors no clause matches. A callee that burns all its gas leaves you only
1/64 of what you had, so keep catch blocks cheap.

## Contracts that call back

An external call runs code you did not write, and that code can call you back before your
function has finished. Many standards rely on this: a receiver **callback** (or hook) such as the
token hook in Medium 05.

```solidity
contract CallbackBooth {
    uint256 public left = 10;

    function sell(uint256 tickets) external {
        left -= tickets; // finish your own state changes first...
        ITicketHolder(msg.sender).onTickets(tickets); // ...then hand over control
    }
}
```

A `Fan` contract implements `onTickets` and, inside it, reads `booth.left()`:

```text
  the fan saw left = 7
```

The callback ran in the middle of `sell` and saw the booth's state. Because `left` was updated
before the call, it saw the truth; a booth that updated after the call would let the fan act on
stale state. Advanced 02 shows how attackers use that. Two habits now: change your state before
calling out, and in a hook check `msg.sender` (the `Fan` reverts with `NotTheBooth(caller)` for
anyone but its booth).

## CREATE2 in one paragraph

`new` normally derives the new address from the creator's address and its nonce. With a **salt**,
`new Booth{salt: salt}()` uses the **CREATE2** opcode instead: the address depends only on the
creator, the salt and the creation code with its constructor arguments, so it can be computed
before deployment. Medium 12 computes one in a test.

## Common mistakes

- **A custom error with only `catch Error(string memory)`.** No clause matches, so the whole
  `try` statement reverts: `[FAIL: SoldOut(2, 5)]`. Add `catch (bytes memory data)` or `catch`.
- **Expecting `msg.sender` to be the user inside a created contract.** It is the factory, as the
  escrow log showed. Pass the user as a constructor argument.
- **An interface that does not match the contract.** A misspelt or mistyped function has another
  selector; the call reverts without data and the trace says `unrecognized function selector
  0xa9ac73d8 ... which has no fallback function`. Copy interfaces from the contract's source.
- **Comparing contract types with `==`.** Since 0.8.31 solc warns: `Comparison of variables of
  contract type is deprecated and scheduled for removal.` Compare `address(a) == address(b)`.

## Practice

1. Write `IPriceList` with `priceOf(uint256 item)`, and a `Till` holding one, whose
   `total(item, quantity)` multiplies the price by the quantity.
2. Fix `EscrowFactory` so the escrow records the user who called `open` as the buyer.
3. Which clause of `tryBuy` runs for `tryBuy(IBooth(address(agent)), 1)`? `Agent` has no `sell`.

### Answers

```solidity
interface IPriceList {
    function priceOf(uint256 item) external view returns (uint256);
}

contract Till {
    IPriceList public immutable prices;

    constructor(IPriceList prices_) {
        prices = prices_;
    }

    function total(uint256 item, uint256 quantity) external view returns (uint256) {
        return prices.priceOf(item) * quantity;
    }
}

// 2. constructor(address buyer_, address seller_) payable { buyer = buyer_; seller = seller_; }
//    and in open: return new Escrow{value: msg.value}(msg.sender, seller);
```

A test of all three (item 2 costs 0.003 ether; the `bytes` clause logs the data's length):

```text
  3 of item 2: 9000000000000000
  buyer is alice: true
  bytes clause, length 0
```

`Agent` has no fallback, so it reverts with no data at all, which only the `bytes` clause matches.

## Key takeaways

- A contract type is an address plus the functions you expect there; converting checks nothing.
- `new C{value: v}(args)` deploys and funds a contract; in its constructor `msg.sender` is the
  creator.
- Errors bubble up and undo everything, unless try/catch handles them; give it a `bytes` clause.
- An external call hands over control: update state first and check who calls your hooks.

## Further reading

- [Solidity documentation: Interfaces](https://docs.soliditylang.org/en/latest/contracts.html#interfaces)
- [Solidity documentation: External calls, new and try/catch](https://docs.soliditylang.org/en/latest/control-structures.html#external-function-calls)
- [Solidity by Example: Try Catch](https://solidity-by-example.org/try-catch/)
