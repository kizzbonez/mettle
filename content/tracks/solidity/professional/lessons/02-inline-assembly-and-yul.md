---
title: Inline Assembly and Yul
summary: Write small, safe pieces of inline assembly in Yul, use memory, storage and transient storage the way Solidity lays them out, revert with custom errors and use clz on Osaka, mark blocks memory-safe, and prove every block right by fuzzing it against a plain Solidity reference.
minutes: 40
objectives:
  - Decide when assembly is justified and name the Solidity checks it removes
  - Write Yul with let, if, switch, for and functions, reading locals, calldata and storage slots
  - Use the free memory pointer, return and revert data, custom errors, tload and tstore, and clz correctly
  - Annotate blocks as memory-safe and test each one against a Solidity reference with a fuzz test
---

## Outline

1. When to use assembly
2. The assembly block
3. Yul: let, if, switch, for and functions
4. Memory: scratch space and the free memory pointer
5. Storage and transient storage
6. Returning and reverting
7. clz and the EVM version
8. memory-safe, and testing against a reference

## When to use assembly

**Inline assembly** writes EVM instructions inside a Solidity function, in a small language
called **Yul**. It bypasses Solidity's protections: no overflow checks, no bounds checks, no
cleaning of narrow types, and nothing stops you writing over memory the compiler is using.

Use it only when Solidity cannot say what you need, or when a measured hot path really needs
the saving: pointing a storage struct at a computed slot (lesson 03), an opcode with no Solidity
syntax yet, bubbling up raw revert data. OpenZeppelin's `StorageSlot`, `TransientSlot` and `Math`
already wrap most of these, audited; prefer them. Every assembly block is code an auditor reads
twice.

## The assembly block

Local variables of value types are read and assigned directly with `:=`. Every Yul value is one
256-bit word, and the instructions are functions named after the opcodes:

```solidity
function addAsm(uint256 a, uint256 b) external pure returns (uint256 r) {
    assembly {
        r := add(a, b)
    }
}
```

```text
addAsm(max, 1) = 0
```

`add` wraps around silently, where `a + b` in Solidity would revert with panic 0x11. Every check
you need, you write yourself.

## Yul: let, if, switch, for and functions

`let x := v` declares a variable, `if cond { }` runs when the condition is non-zero (there is no
`else`), `switch` compares with literal `case`s and an optional `default`, and
`for { init } cond { post } { body }` loops. A Yul `function` returns through named results, and
`leave` exits it early. Comparisons are `lt`, `gt`, `eq` and `iszero`; bits are `and`, `or`,
`not`, `shl(bits, x)` and `shr(bits, x)`.

```solidity
/// @notice The number of decimal digits of x (1 for 0).
function digits(uint256 x) external pure returns (uint256 n) {
    assembly ("memory-safe") {
        function count(v) -> c {
            for {} gt(v, 0) {} {
                c := add(c, 1)
                v := div(v, 10)
            }
        }
        switch x
        case 0 { n := 1 }
        default { n := count(x) }
    }
}
```

`digits(0)`, `digits(7)`, `digits(12345)` and `digits(type(uint256).max)`:

```text
1 1 5 78
```

A dynamic calldata array has `xs.offset` (where its elements start) and `xs.length`, and
`calldataload(p)` reads the word at byte `p`, without bounds checks:

```solidity
function sumWords(uint256[] calldata xs) external pure returns (uint256 total) {
    assembly ("memory-safe") {
        for { let i := 0 } lt(i, xs.length) { i := add(i, 1) } {
            let x := calldataload(add(xs.offset, shl(5, i))) // offset + 32 * i
            total := add(total, x)
            if lt(total, x) {
                // wrapped around: revert with Panic(0x11), as checked arithmetic would
                mstore(0x00, 0x4e487b71)
                mstore(0x20, 0x11)
                revert(0x1c, 0x24)
            }
        }
    }
}
```

For `[1, 2, 3]` the test logs the sum; with `type(uint256).max` as the last element its
`vm.expectRevert(stdError.arithmeticError)` passes too:

```text
[PASS] test_sum() (gas: 22199)
Logs:
  sum: 6
```

## Memory: scratch space and the free memory pointer

Solidity organises memory in a fixed way, and your assembly must respect it:

- `0x00` to `0x3f`: **scratch space**, free for short-lived use such as hashing two words;
- `0x40`: the **free memory pointer**, the address of the first unused byte;
- `0x60`: the **zero slot**, which must stay zero;
- from `0x80`: memory that Solidity hands out and never frees.

```solidity
function freePointer() external pure returns (uint256 before, uint256 afterArray) {
    assembly {
        before := mload(0x40)
    }
    uint256[] memory xs = new uint256[](2);
    xs[0] = 1;
    assembly {
        afterArray := mload(0x40)
    }
}
```

```text
free memory pointer: 128 after new uint256[](2): 224
```

The array took 96 bytes: a length word and two elements. To allocate memory yourself, read
`mload(0x40)`, use the bytes from there, and store the new end back at `0x40`.

## Storage and transient storage

A state variable `v` gives its slot as `v.slot` and its byte position inside the slot as
`v.offset`. `sload(slot)` and `sstore(slot, value)` cost exactly what Solidity's reads and writes
cost. For `uint256 counter = 7; uint64 small = 5; address keeper = address(0xBEEF);`:

```text
counter slot 0
small slot/offset 1 0
keeper slot/offset 1 8
keeper read in assembly 0x000000000000000000000000000000000000bEEF
```

`keeper` shares slot 1 with `small`, so reading it means shifting the word right by
`offset * 8` bits and masking 20 bytes:
`and(shr(mul(keeper.offset, 8), sload(keeper.slot)), 0xffffffffffffffffffffffffffffffffffffffff)`.
`tload(slot)` and `tstore(slot, value)` work the same way on transient storage (EIP-1153, Cancun);
since 0.8.28 the `transient` keyword is usually clearer.

## Returning and reverting

`return(p, size)` and `revert(p, size)` end the **whole call** with the bytes at `p`. Revert data
for a custom error is its 4-byte selector followed by the ABI-encoded arguments. A `bytes4` value
sits in the high-order bytes of a word, so storing it at 0 puts the selector in bytes 0 to 3:

```solidity
error ZeroHasNoBits();

/// @notice Index of the highest set bit of x.
function topBit(uint256 x) external pure returns (uint256 r) {
    bytes4 selector = ZeroHasNoBits.selector;
    assembly ("memory-safe") {
        if iszero(x) {
            mstore(0x00, selector)
            revert(0x00, 0x04)
        }
        r := sub(255, clz(x))
    }
}
```

`topBit(1)`, `topBit(256)` and `topBit(type(uint256).max)`, then `vm.expectRevert` for 0:

```text
[PASS] test_topBit() (gas: 30469)
Logs:
  0 8 255
```

With arguments, store each one after the selector: `mstore(0x04, deadline)` then
`revert(0x00, 0x24)`.

## clz and the EVM version

`clz(x)` counts the leading zero bits of `x`, 256 for zero. It is the `CLZ` opcode of EIP-7939,
live since the Fusaka upgrade (EVM version `osaka`, 3 December 2025), and a Yul builtin since
solc 0.8.31; the opcode costs 5 gas. For an older target it does not compile:

```text
Error (4948): The "clz" instruction is only available for Osaka-compatible VMs (you are currently compiling for "prague").
```

Check that every chain you deploy to supports the EVM version you compile for (Professional 09).

## memory-safe, and testing against a reference

`assembly ("memory-safe") { ... }` promises the compiler that the block only touches scratch
space, memory it allocated through the free memory pointer, or memory Solidity gave it. The
compiler then keeps the freedom to move variables into memory, which via-IR needs to escape
"stack too deep" errors. A false promise is undefined behaviour that tests rarely catch. The old
comment form now warns:

```text
Warning (2424): Natspec memory-safe-assembly special comment for inline assembly is deprecated and scheduled for removal. Use the memory-safe block annotation instead.
```

Every assembly function deserves a plain Solidity **reference** that is obviously right, and a
fuzz test that compares the two:

```solidity
function testFuzz_topBit_matches_reference(uint256 x) public view {
    vm.assume(x != 0);
    assertEq(b.topBit(x), b.topBitReference(x), "topBit against the Solidity reference");
}
```

```text
[PASS] testFuzz_topBit_matches_reference(uint256) (runs: 256, μ: 33122, ~: 24363)
```

`topBitReference` shifts `x` right until it is 1, counting. Test the edges too: 0, 1 and
`type(uint256).max`.

## Common mistakes

- **A hand-typed selector.** `mstore(0x00, 0xa3c1d0d6)` made the test fail with
  `Error != expected error: custom error 0xa3c1d0d6 != ZeroHasNoBits()`. Take the selector from
  `ZeroHasNoBits.selector`, or check it with `forge inspect Bits errors` (`4a72028b`).
- **`return` in an internal function.** It ends the external call, so the caller's remaining
  code never runs; solc warns `Warning (5740): Unreachable code.`, and the state write after it
  was lost. Assign results to variables instead.
- **Forgetting that Yul wraps.** `add`, `sub` and `mul` never revert; check overflow as
  `sumWords` does.
- **Reading a packed slot whole.** `sload(keeper.slot)` returns `small` and `keeper` together;
  shift by the offset and mask.

## Practice

1. Write `min(uint256 a, uint256 b)` in Yul and fuzz it against `a < b ? a : b`.
2. Allocate 64 bytes through the free memory pointer, store `a` and `b` there, and return the
   start, the new free pointer and `mload(p) + mload(p + 32)`.
3. Revert from assembly with `error TooLate(uint256 deadline)` when `timestamp()` is past it.

### Answers

```solidity
function min(uint256 a, uint256 b) external pure returns (uint256 m) {
    assembly ("memory-safe") {
        m := a
        if lt(b, a) { m := b }
    }
}

function twoWords(uint256 a, uint256 b) external pure returns (uint256 p, uint256 next, uint256 sum) {
    assembly ("memory-safe") {
        p := mload(0x40)
        mstore(p, a)
        mstore(add(p, 0x20), b)
        next := add(p, 0x40)
        mstore(0x40, next) // claim the 64 bytes
        sum := add(mload(p), mload(add(p, 0x20)))
    }
}

function checkDeadline(uint256 deadline) external view {
    bytes4 selector = TooLate.selector;
    assembly ("memory-safe") {
        if gt(timestamp(), deadline) {
            mstore(0x00, selector)
            mstore(0x04, deadline)
            revert(0x00, 0x24)
        }
    }
}
```

The fuzz test, `twoWords(3, 4)` logged, and a test expecting
`abi.encodeWithSelector(TooLate.selector, 1_000)` at time 2,000:

```text
[PASS] testFuzz_min_matches_solidity(uint256,uint256) (runs: 256, μ: 6936, ~: 6928)
[PASS] test_too_late() (gas: 16022)
[PASS] test_two_words() (gas: 10580)
Logs:
  128 192 7
```

## Key takeaways

- Assembly removes Solidity's checks; use it rarely, in small, commented blocks.
- Respect the memory layout: scratch space, the pointer at `0x40`, the zero slot, allocation
  from `0x80`.
- `return` and `revert` end the whole call; custom error data is the selector plus arguments.
- `clz` needs `osaka`; mark blocks `("memory-safe")` only when true.
- Fuzz every block against a Solidity reference.

## Further reading

- [Solidity documentation: Inline Assembly](https://docs.soliditylang.org/en/latest/assembly.html)
- [Solidity documentation: Yul](https://docs.soliditylang.org/en/latest/yul.html)
- [Solidity documentation: Layout in memory](https://docs.soliditylang.org/en/latest/internals/layout_in_memory.html)
- [EIP-7939: Count leading zeros (CLZ) opcode](https://eips.ethereum.org/EIPS/eip-7939)
