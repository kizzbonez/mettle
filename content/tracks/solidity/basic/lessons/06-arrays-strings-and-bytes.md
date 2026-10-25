---
title: Arrays, Strings and Bytes
summary: Keep lists in fixed and dynamic storage arrays, grow and shrink them with push and pop, remove items with swap-and-pop, build fixed-size memory arrays, work with bytes and strings (joining, comparing by hash, measuring in bytes), and know what returning an array costs.
minutes: 35
objectives:
  - Declare fixed and dynamic storage arrays and use push, pop, length and indexing, recognising the out-of-bounds and empty-pop panics
  - Remove an element with swap-and-pop and explain why delete alone leaves a gap
  - Build a memory array with new T[](n), filling it in two passes when the size is not known
  - Join strings with string.concat, compare them with keccak256, and measure them in bytes
---

## Outline

1. Arrays in storage: fixed and dynamic
2. push, pop, length and out-of-bounds panics
3. Removing an element: delete and swap-and-pop
4. Arrays in memory
5. bytes and string
6. Returning arrays, and what it costs

## Arrays in storage: fixed and dynamic

An array state variable lives in **storage**, the contract's permanent data. `uint256[12]` is a
**fixed-size array**: always 12 elements, each starting at zero. `string[]` is a **dynamic
array**, which starts empty and grows. A book club keeps its reading list:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ReadingList {
    string[] public titles; // dynamic: grows and shrinks
    uint256[12] public picksPerMonth; // fixed: always 12 entries, all 0 at first

    function add(string memory title) external {
        titles.push(title);
    }

    function removeLast() external {
        titles.pop();
    }

    function count() external view returns (uint256) {
        return titles.length;
    }

    function recordPick(uint256 month) external {
        picksPerMonth[month] += 1;
    }
}
```

A parameter of an array, `string` or `bytes` type needs a **data location**; write `memory` for
now (lesson 08 explains it). The `public` getter of an array takes an index and returns one
element: `titles(0)`. There is no getter for the whole array.

## push, pop, length and out-of-bounds panics

`push(x)` appends, `pop()` removes the last element, `length` counts them. Indexes start at 0,
and every access is checked. With "Moby-Dick" and "Middlemarch" added, four tests log the count,
both titles and `picksPerMonth(11)`, read `titles(2)`, call `removeLast()` three times and call
`recordPick(12)`:

```text
[FAIL: panic: array out-of-bounds access (0x32)] test_fixed_index_too_high() (gas: 27174)
[FAIL: panic: called `.pop()` on an empty array (0x31)] test_pop_too_often() (gas: 92916)
[PASS] test_push_and_read() (gas: 46379)
Logs:
  2 Moby-Dick Middlemarch
  0

[FAIL: EvmError: Revert] test_read_past_the_end() (gas: 7899)
```

Your own code reading past the end panics with 0x32; the generated getter reverts without data.
`push` and `pop` exist only on dynamic storage arrays.

## Removing an element: delete and swap-and-pop

`delete titles[i]` sets one element back to its zero value (an empty string) but keeps the
length, leaving a gap. To really remove an element, move the last one into its place and pop,
which is called **swap-and-pop**:

```solidity
error NoSuchTitle(uint256 index, uint256 count);

/// @dev Leaves an empty string where the title was: the length does not change.
function blank(uint256 index) external {
    delete titles[index];
}

/// @notice Removes a title in constant gas. The last title takes its place.
function remove(uint256 index) external {
    if (index >= titles.length) revert NoSuchTitle(index, titles.length);
    titles[index] = titles[titles.length - 1];
    titles.pop();
}
```

Starting from four titles, `blank(1)` and then `remove(1)`:

```text
after blank(1):  [Moby-Dick] [] [Beloved] [Kindred]
after remove(1): [Moby-Dick] [Kindred] [Beloved]
```

Swap-and-pop costs the same however long the array is, but it changes the order: Kindred is now
at index 1. Never hand out array indexes as lasting IDs, since a removal silently makes one
point at a different element. If order matters, shift every later element down one place
instead, which costs gas for each element moved:

```solidity
function removeInOrder(uint256 index) external {
    if (index >= titles.length) revert NoSuchTitle(index, titles.length);
    for (uint256 i = index; i + 1 < titles.length; i++) {
        titles[i] = titles[i + 1];
    }
    titles.pop();
}
```

From the same four titles, `removeInOrder(1)` leaves `[Moby-Dick] [Beloved] [Kindred]`.

## Arrays in memory

`new string[](n)` creates a **memory array**, which exists only during the call. Its length is
fixed when it is created: `push` does not compile.

```text
Error (4994): Member "push" is not available in uint256[] memory outside of storage.
```

When you do not know the size in advance, count in a first pass, allocate, then fill:

```solidity
/// @notice The titles longer than `minBytes` bytes, in list order.
function longTitles(uint256 minBytes) external view returns (string[] memory found) {
    uint256 matches = 0;
    for (uint256 i = 0; i < titles.length; i++) {
        if (bytes(titles[i]).length > minBytes) matches++;
    }

    found = new string[](matches); // a memory array has a fixed length
    uint256 next = 0;
    for (uint256 i = 0; i < titles.length; i++) {
        if (bytes(titles[i]).length > minBytes) {
            found[next] = titles[i];
            next++;
        }
    }
}
```

With Moby-Dick, Middlemarch and Beloved, a test logs `found.length` and both elements of
`longTitles(8)`:

```text
2 Moby-Dick Middlemarch
```

## bytes and string

`bytes` is a dynamic array of bytes; `string` is the same data meant as UTF-8 text, with fewer
operations. A string has no `length` and no indexing, and `==` does not work on it:

```text
Error (2271): Built-in binary operator == cannot be applied to types string memory and string memory.
Error (9582): Member "length" not found or not visible after argument-dependent lookup in string memory.
```

Convert with `bytes(s)` to measure or index, and compare by hash:

```solidity
function sameTitle(string memory a, string memory b) public pure returns (bool) {
    return keccak256(bytes(a)) == keccak256(bytes(b));
}

function shelfLabel(string memory title, string memory author) public pure returns (string memory) {
    return string.concat(title, " by ", author);
}

function initial(string memory title) public pure returns (bytes1) {
    return bytes(title)[0];
}
```

A test logs `shelfLabel("Beloved", "Toni Morrison")`, two comparisons, `bytes("Kindred").length`
and `bytes(unicode"Café Society").length`, `initial("Kindred")`, and
`bytes.concat(bytes("ab"), hex"0102")`:

```text
Beloved by Toni Morrison
true false
7 13
0x4b
0x61620102
```

`keccak256` hashes bytes into a `bytes32`, so equal strings give equal hashes, and the comparison
is exact: "Beloved" is not "beloved". `string.concat` and `bytes.concat` join any number of
pieces (`hex"0102"` is a literal of the two bytes 0x01 and 0x02). A length is in **bytes**, not characters: "Café Society" has 12 characters, but é takes
two bytes in UTF-8. Text outside ASCII needs the `unicode"..."` prefix; `"Café"` alone fails
with `Invalid character in string`. So a limit like "names up to 16 bytes" is a limit in bytes,
and it matters, since storing text costs gas for every 32 bytes.

## Returning arrays, and what it costs

`function allTitles() external view returns (string[] memory) { return titles; }` copies every
element out of storage. Measured with `gasleft()` after adding 10, then 100 titles:

```text
10 titles: 45385
100 titles: 420970
```

Calling a `view` function from outside the chain is free, but a contract calling it pays, and a
list that grows without limit will one day be too big to return at all. Offer a getter by index
or by page (`titlesFrom(start, howMany)`) as well, and cap lists that anyone can grow.

## Common mistakes

- **Subtracting from an empty length.** `uint256 last = titles.length - 1;` before checking
  panics with `arithmetic underflow or overflow (0x11)` on an empty array. Check
  `index >= titles.length` first, as `remove` does.
- **Removing with `delete`.** The length stays the same and a blank is left behind. Use
  swap-and-pop, or shift if order matters.
- **Comparing strings with `==`.** It does not compile (error 2271). Compare
  `keccak256(bytes(a)) == keccak256(bytes(b))`.
- **Counting characters.** `bytes(unicode"Café").length` is 5, not 4. Set and explain limits in
  bytes.

## Practice

1. Write `last()`, which returns the last title or reverts with `NoSuchTitle(0, 0)` when the list
   is empty.
2. Write `contains(string memory title) returns (bool)`.
3. What does `bytes(unicode"naïve").length` return, and what happens without the `unicode`
   prefix?

### Answers

```solidity
function last() external view returns (string memory) {
    if (titles.length == 0) revert NoSuchTitle(0, 0);
    return titles[titles.length - 1];
}

function contains(string memory title) external view returns (bool) {
    bytes32 wanted = keccak256(bytes(title));
    for (uint256 i = 0; i < titles.length; i++) {
        if (keccak256(bytes(titles[i])) == wanted) return true;
    }
    return false;
}
```

With "Beloved" and "Kindred" in the list, a test logs `last()`, `contains("Kindred")`,
`contains("kindred")` and the length of `unicode"naïve"`:

```text
Kindred true false 6
```

`ï` takes two bytes, so the five letters are six bytes. Without the prefix the literal does not
compile: `Invalid character in string`. `contains` hashes the wanted title once, outside the
loop, and its loop grows with the list: cap the list.

## Key takeaways

- `T[k]` has a fixed length; `T[]` in storage grows with `push` and shrinks with `pop`.
- Out-of-bounds access and popping an empty array panic (0x32, 0x31).
- `delete a[i]` leaves a gap; swap-and-pop removes in constant gas but changes the order.
- Memory arrays are created with `new T[](n)` and never change length.
- Strings: `bytes(s).length` counts bytes, `string.concat` joins, `keccak256` compares.
- Returning a whole array costs gas per element: cap lists and offer paged getters.

## Further reading

- [Solidity documentation: Arrays](https://docs.soliditylang.org/en/latest/types.html#arrays)
- [Solidity documentation: bytes and string as arrays](https://docs.soliditylang.org/en/latest/types.html#bytes-and-string-as-arrays)
- [Solidity documentation: Security considerations, gas limit and loops](https://docs.soliditylang.org/en/latest/security-considerations.html#gas-limit-and-loops)
