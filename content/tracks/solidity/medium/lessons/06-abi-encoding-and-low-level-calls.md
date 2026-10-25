---
title: ABI Encoding and Low-Level Calls
summary: See what the bytes of a call look like, compute function selectors, build calldata with abi.encodeCall and its unchecked cousins, encode and decode values, avoid abi.encodePacked hash collisions, make low-level call and staticcall with their return data, pass a callee's error on unchanged, and meet delegatecall.
minutes: 35
objectives:
  - Compute a function selector from its canonical signature and read the calldata of a call
  - Build calldata with abi.encodeCall, encodeWithSelector and encodeWithSignature, and decode results with abi.decode
  - Explain why abi.encodePacked of two dynamic values can collide, and hash with abi.encode instead
  - Make low-level call and staticcall safely, checking success, code and return data, and bubble up the callee's revert data
---

## Outline

1. What the ABI is
2. Function selectors
3. Building calldata
4. abi.encode, abi.decode and the packed mode
5. Low-level call and staticcall
6. Passing a failure on
7. delegatecall: their code, your storage

## What the ABI is

When you call `token.transfer(bob, 5)` through an interface (lesson 01), the compiler turns it
into bytes. The **ABI** (Application Binary Interface) is the rule for those bytes: how a call,
its arguments, its return values, errors and events are laid out. Wallets, block explorers, test
frameworks and other contracts all speak it; the JSON ABI that `forge build` writes describes a
contract's functions in it. This lesson works at the level of those bytes.

## Function selectors

The first four bytes of a call's data, the **calldata**, are the **function selector**: the first
four bytes of the keccak-256 hash of the function's **canonical signature**, its name and
parameter types with no spaces, no parameter names, and full type names (`uint256`, never
`uint`). The contract compares them with its functions' selectors and jumps to the match.

```solidity
interface IToken {
    function transfer(address to, uint256 amount) external returns (bool);
}

contract EncodingTest is Test {
    function test_selectors_and_calldata() public pure {
        console.logBytes4(bytes4(keccak256("transfer(address,uint256)")));
        console.logBytes4(IToken.transfer.selector);

        bytes memory bySignature = abi.encodeWithSignature("transfer(address,uint256)", address(0xB0B), 5);
        bytes memory bySelector = abi.encodeWithSelector(IToken.transfer.selector, address(0xB0B), 5);
        bytes memory byCall = abi.encodeCall(IToken.transfer, (address(0xB0B), 5));
        console.logBytes(byCall);
        console.log("length:", byCall.length);
        console.log(
            "all equal:", keccak256(bySignature) == keccak256(byCall) && keccak256(bySelector) == keccak256(byCall)
        );
    }
}
```

```text
  0xa9059cbb
  0xa9059cbb
  0xa9059cbb0000000000000000000000000000000000000000000000000000000000000b0b0000000000000000000000000000000000000000000000000000000000000005
  length: 68
  all equal: true
```

Read the calldata: the selector `a9059cbb`, then each argument as a 32-byte **word**, the address
padded on the left with zeros, then the amount. Inside a contract, `this.f.selector` gives the
selector of its own function `f`, and `msg.sig` is the selector of the current call.

## Building calldata

The three builders produced the same 68 bytes, but they are not equally safe:

- `abi.encodeWithSignature("transfer(address,uint256)", ...)` hashes a string. A typo or a space
  makes a different selector, and nothing complains.
- `abi.encodeWithSelector(IToken.transfer.selector, ...)` gets the selector right, but does not
  check the arguments.
- `abi.encodeCall(IToken.transfer, (to, amount))` takes the function itself and **type-checks**
  the arguments. Swap them and the build fails:

```text
Error (5407): Cannot implicitly convert component at position 0 from "int_const 5" to "address".
  --> src/Example.sol:10:49:
   |
10 |         return abi.encodeCall(IToken.transfer, (5, address(0xB0B)));
   |                                                 ^
```

Prefer `abi.encodeCall` whenever you know the function at compile time.

## abi.encode, abi.decode and the packed mode

`abi.encode(values...)` encodes values without a selector, the same way. Static values take one
word each. A **dynamic** value (`string`, `bytes`, a dynamic array) puts an **offset** in its
place and its length and contents at the end. `abi.decode(data, (types...))` reverses it.
`abi.encodePacked` instead glues the values together with no padding and no lengths:

```solidity
words(abi.encode(uint16(7), "hi")); // a helper that prints one 32-byte word per line
console.logBytes(abi.encodePacked(uint16(7), "hi"));

(uint16 n, string memory s) = abi.decode(abi.encode(uint16(7), "hi"), (uint16, string));
console.log(n, s);

console.log("packed collide:", keccak256(abi.encodePacked("ab", "c")) == keccak256(abi.encodePacked("a", "bc")));
console.log("encode collide:", keccak256(abi.encode("ab", "c")) == keccak256(abi.encode("a", "bc")));
```

```text
  0x0000000000000000000000000000000000000000000000000000000000000007
  0x0000000000000000000000000000000000000000000000000000000000000040
  0x0000000000000000000000000000000000000000000000000000000000000002
  0x6869000000000000000000000000000000000000000000000000000000000000
  0x00076869
  7 hi
  packed collide: true
  encode collide: false
```

The second word says "the string starts at byte `0x40`"; there you find its length, 2, and the
bytes of `hi`. Packed, `"ab","c"` and `"a","bc"` both become `abc`, so their hashes collide. If a
contract derives an id, a mapping key or a signed message from `keccak256(abi.encodePacked(a, b))`
with two dynamic values, an attacker can pick different inputs with the same hash. Hash with
`abi.encode`, which keeps the lengths. Packed mode is fine for one dynamic value, or fixed-size ones.

## Low-level call and staticcall

`address.call(data)` sends any calldata and returns `(bool success, bytes memory returnData)`;
`staticcall` does the same but makes the callee fail if it tries to change state. Unlike a call
through an interface, a low-level call **does not revert when the callee fails**: you must check
`success` yourself.

```solidity
contract Counter {
    uint256 public count;

    error TooBig(uint256 by);

    function add(uint256 by) external returns (uint256) {
        if (by > 10) revert TooBig(by);
        count += by;
        return count;
    }
}

contract LowLevelTest is Test {
    Counter counter = new Counter();

    function test_call_and_staticcall() public {
        (bool ok, bytes memory data) = address(counter).call(abi.encodeCall(Counter.add, (3)));
        console.log("add(3):", ok, abi.decode(data, (uint256)));

        (ok, data) = address(counter).call(abi.encodeCall(Counter.add, (11)));
        console.log("add(11):", ok);
        console.logBytes(data);

        (ok, data) = address(counter).staticcall(abi.encodeCall(counter.count, ()));
        console.log("count():", ok, abi.decode(data, (uint256)));

        (ok, data) = address(0xDEAD).call(abi.encodeCall(Counter.add, (3)));
        console.log("no code:", ok, data.length);
    }
}
```

```text
  add(3): true 3
  add(11): false
  0xe0a89a3a000000000000000000000000000000000000000000000000000000000000000b
  count(): true 3
  no code: true 0
```

On failure, the return data is the **revert data**: the custom error's selector (`e0a89a3a` is
`TooBig(uint256)`) and its argument, encoded like a call. The last line is the trap: the EVM
treats a call to an address **without code** as a success that returns nothing. A call through an
interface reverts when the target has no code; a low-level call does not, so check
`target.code.length` yourself.

## Passing a failure on

A contract that forwards calls should pass the callee's error on unchanged, so callers and tests
see the real reason. Solidity has no statement that reverts with raw bytes, so this is done with
two lines of **inline assembly** (Professional 02 teaches assembly):

```solidity
function forward(address target, bytes calldata data) external returns (bytes memory) {
    if (target.code.length == 0) revert NoCode(target);
    (bool ok, bytes memory ret) = target.call(data);
    if (!ok) {
        // ret holds the callee's revert data; re-throw it unchanged.
        assembly ("memory-safe") {
            revert(add(ret, 32), mload(ret))
        }
    }
    return ret;
}
```

A test forwards `add(11)` through it, through `forwardBlind`, which ends in
`if (!ok) revert CallFailed();`, and to an empty address:

```text
[FAIL: TooBig(11)] test_forward() (gas: 34690)
[FAIL: CallFailed()] test_forward_blind() (gas: 34519)
[FAIL: NoCode(0x000000000000000000000000000000000000dEaD)] test_forward_to_nothing() (gas: 31325)
```

`ret` in memory starts with a 32-byte length, so `add(ret, 32)` is where the bytes begin and
`mload(ret)` is how many there are. OpenZeppelin's `Address.functionCall` (Medium 11) does the same
checks for you. Never trust revert data as proof of what went wrong: any contract can return
bytes that look like any error.

## delegatecall: their code, your storage

`delegatecall` runs the target's code **in the caller's context**: the caller's storage, balance
and address, with `msg.sender` and `msg.value` unchanged.

```solidity
contract Adder {
    uint256 public count; // slot 0

    function add(uint256 by) external {
        count += by;
    }
}

contract Host {
    uint256 public count; // slot 0, like Adder's

    error DelegateFailed();

    function addWith(address logic, uint256 by) external {
        (bool ok,) = logic.delegatecall(abi.encodeCall(Adder.add, (by)));
        if (!ok) revert DelegateFailed();
    }
}
```

```text
  host.count: 5
  adder.count: 0
```

`Adder`'s code wrote to slot 0 of `Host`. This powers external libraries (lesson 03) and proxies,
and it is also dangerous: the code you delegate to can overwrite any slot you own. Never
delegatecall an address a user chooses. Advanced 08 covers the attacks.

## Common mistakes

- **A sloppy signature string.** `"add(uint)"` hashes to `0xa5395601`, not `add(uint256)`'s
  `0x1003e2d2`; the call finds no function and returns `ok: false returned bytes: 0`. Use
  `abi.encodeCall`.
- **Ignoring `success`.** `Warning (9302): Return value of low-level calls not used.` The failure
  goes unnoticed. Check it and revert or bubble up.
- **Decoding what is not there.** After a call to an address without code, `abi.decode(data,
  (uint256))` fails with `[FAIL: EvmError: Revert]`. Check the code and the data's length first.
- **Writing under staticcall.** `staticcall` to `add` returns `ok: false returned bytes: 0` and
  burns all the gas it was given. Use it only for `view` functions.

## Practice

1. Compute the selector of `approve(address,uint256)` by hashing and from an interface.
2. Write `balanceVia(address token, address who)`, which reads `balanceOf(who)` with
   `staticcall` and returns it, reverting with `ReadFailed()` on failure.
3. A raffle derives ticket ids as `keccak256(abi.encodePacked(name, town))`. What goes wrong?

### Answers

```solidity
interface IBalances {
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address who) external view returns (uint256);
}

contract Reader {
    error ReadFailed();

    function balanceVia(address token, address who) external view returns (uint256) {
        (bool ok, bytes memory data) = token.staticcall(abi.encodeCall(IBalances.balanceOf, (who)));
        if (!ok || data.length != 32) revert ReadFailed();
        return abi.decode(data, (uint256));
    }
}
```

Tests print both selectors, read a mock token that holds 40 for everyone, expect `ReadFailed()`
from an empty address, and print the two packed names and whether their hashes match:

```text
[PASS] test_packed_names() (gas: 8562)
Logs:
  Annabel Annabel
  true

[PASS] test_reader() (gas: 173841)
Logs:
  balance: 40

[PASS] test_reader_refuses_no_code() (gas: 12732)
[PASS] test_selectors() (gas: 6278)
Logs:
  0x095ea7b3
  0x095ea7b3
```

3. `("Ann", "abel")` and `("Anna", "bel")` both pack to `Annabel`: two people get the same ticket
   id. Use `keccak256(abi.encode(name, town))`.

## Key takeaways

- Calldata is a 4-byte selector, `bytes4(keccak256("name(type1,type2)"))`, then 32-byte words.
- Build calls with `abi.encodeCall`: the compiler checks the function and the argument types.
- `abi.encodePacked` with two dynamic values can collide; hash with `abi.encode`.
- Low-level calls never revert by themselves: check `success`, check the target has code, and
  bubble up the revert data.
- `delegatecall` runs other code on your storage; only ever delegate to code you control.

## Further reading

- [Solidity documentation: Contract ABI Specification](https://docs.soliditylang.org/en/latest/abi-spec.html)
- [Solidity documentation: ABI encoding and decoding functions](https://docs.soliditylang.org/en/latest/units-and-global-variables.html#abi-encoding-and-decoding-functions)
- [Solidity documentation: External function calls](https://docs.soliditylang.org/en/latest/control-structures.html#external-function-calls)
- [Solidity documentation: Members of address types](https://docs.soliditylang.org/en/latest/units-and-global-variables.html#members-of-address-types)
