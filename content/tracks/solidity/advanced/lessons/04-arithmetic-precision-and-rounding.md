---
title: Arithmetic, Precision and Rounding
summary: Integer division truncates, so multiply before you divide, scale by 1e18 to keep precision, round in the protocol's favour with Math.mulDiv, treat unchecked blocks and narrowing casts as hazards, reach for SafeCast, and let a fuzz test find the rounding bug you missed.
minutes: 40
objectives:
  - Explain why integer division truncates and reorder operations to multiply before dividing
  - Scale fixed-point values by 1e18 and choose a rounding direction with Math.mulDiv
  - Spot a wrong unchecked block and a silently truncating cast, and replace the cast with SafeCast
  - Write a fuzz test that finds a rounding or precision bug as a counterexample
---

## Outline

1. Integer division truncates
2. Multiply before dividing
3. Rounding direction
4. unchecked done wrong
5. Unsafe casts and SafeCast
6. Fuzzing for rounding bugs

Solidity has no decimals. Every number is an integer, so arithmetic that looks right can quietly
lose value, and in a contract that holds money each lost or created wei is a bug. This is OWASP
SC07 (arithmetic, rounding and precision) and SC09 (overflow and underflow).

## Integer division truncates

**Integer division** throws away the remainder, rounding towards zero. `7 / 2` is `3`, not `3.5`:

```solidity
    function test_truncation() public pure {
        console.log("7 / 2 =", uint256(7) / 2);
        console.log("1e18 * 3 / 7 =", uint256(1e18) * 3 / 7);
        console.log("(3 / 7) * 1e18 =", (uint256(3) / 7) * 1e18);
        console.log("mulDiv(3, 1e18, 7) =", Math.mulDiv(3, 1e18, 7));
    }
```

```text
  7 / 2 = 3
  1e18 * 3 / 7 = 428571428571428571
  (3 / 7) * 1e18 = 0
  mulDiv(3, 1e18, 7) = 428571428571428571
```

The order matters. `1e18 * 3 / 7` keeps nearly all the precision, but `(3 / 7) * 1e18` computes
`3 / 7 = 0` first and loses everything.

## Multiply before dividing

So the rule: **multiply before you divide**. A share pool shows the cost. Each depositor's
pay-out is `shares * balance / totalShares`. Dividing first truncates a minority holder's share
to nothing:

```solidity
    function redeemBad(uint256 shares) external view returns (uint256) {
        return (shares / totalShares) * address(this).balance; // divide first: wrong
    }

    function redeemGood(uint256 shares) external view returns (uint256) {
        return Math.mulDiv(shares, address(this).balance, totalShares); // multiply first
    }
```

With Bob holding a quarter of the shares:

```text
  bob shares 1000000000000000000 of total 4000000000000000000
  redeemBad  (divide first): 0
  redeemGood (mulDiv)      : 1000000000000000000
```

`redeemBad` pays Bob nothing. For ratios that are not whole numbers, keep extra digits by
**scaling**: store a rate as "value times 1e18" (one **WAD**, the usual 18-decimal fixed-point
unit), do the arithmetic, then divide the 1e18 out at the end. **`Math.mulDiv(x, y, d)`** from
OpenZeppelin computes `x * y / d` with a 512-bit intermediate product, so `x * y` cannot overflow
`uint256` on the way, something plain `*` then `/` cannot promise.

## Rounding direction

Because division truncates, someone is always short by up to one unit. Decide who, and make it
the protocol, never the caller. `Math.mulDiv` takes a rounding mode:

```solidity
    function test_rounding_direction() public pure {
        console.log("floor mulDiv(10, 1, 3) =", Math.mulDiv(10, 1, 3, Math.Rounding.Floor));
        console.log("ceil  mulDiv(10, 1, 3) =", Math.mulDiv(10, 1, 3, Math.Rounding.Ceil));
    }
```

```text
  floor mulDiv(10, 1, 3) = 3
  ceil  mulDiv(10, 1, 3) = 4
```

Round **down** (`Floor`) what you pay out and the shares you mint for a deposit; round **up**
(`Ceil`, or `Math.ceilDiv`) what you charge or the shares you burn for a withdrawal. The dust then
stays with the contract. Round the other way and each operation leaks a little; an attacker who
repeats it thousands of times turns the leak into a real loss.

## unchecked done wrong

Since 0.8, arithmetic reverts on overflow or underflow with **panic `0x11`**. An `unchecked`
block (Basic 03) turns that off and the value wraps instead:

```solidity
    function test_unchecked_wraps() public pure {
        uint256 a = 0;
        unchecked {
            console.log("0 - 1 unchecked =", a - 1);
        }
    }
```

```text
  0 - 1 unchecked = 115792089237316195423570985008687907853269984665640564039457584007913129639935
```

`0 - 1` became the largest `uint256`. In a balance that is a drain: a withdrawal of more than you
hold wraps your balance to an enormous number. Use `unchecked` only where you have proved the
operation cannot overflow (a loop counter, or a subtraction already guarded by a check), and never
around a value a caller controls. `unchecked` does not disable the division-by-zero check or
change how casts truncate.

## Unsafe casts and SafeCast

A narrowing cast such as `uint128(x)` keeps only the low bits and never reverts, so a value too
big for the target is silently corrupted:

```solidity
    function test_unsafe_cast() public pure {
        uint256 big = uint256(type(uint128).max) + 5;
        console.log("uint128(type(uint128).max + 5) =", uint256(uint128(big)));
    }
```

```text
  uint128(type(uint128).max + 5) = 4
```

The amount wrapped to `4`. Store that as a balance and the books no longer match the ether.
OpenZeppelin's **`SafeCast`** reverts instead, naming the width and the value:

```solidity
    function narrow(uint256 x) external pure returns (uint128) {
        return SafeCast.toUint128(x);
    }
```

```text
[PASS] test_safecast_reverts()
```

with the revert `SafeCastOverflowedUintDowncast(128, 340282366920938463463374607431768211461)`.
Cast down with `SafeCast` whenever the source value is not already provably in range.

## Fuzzing for rounding bugs

Rounding bugs hide at specific inputs, so state the property and let a **fuzz test** (Basic 12)
search for a counterexample. Here the claim is that an evenly split bill adds back up:

```solidity
    function testFuzz_shares_add_up(uint256 total, uint8 people) public view {
        vm.assume(people > 0);
        uint256 each = till.perPerson(total, people); // returns total / people
        assertEq(each * people, total, "the per-person shares add up to the bill");
    }
```

```text
[FAIL: the per-person shares add up to the bill: 742886487892369547698386939959150855759913656 != 742886487892369547698386939959150855759913659; counterexample: calldata=0x89301a55... args=[742886487892369547698386939959150855759913659 [7.428e44], 11]]
```

Forge found 11 people and a total that leaves a remainder of 3 wei. The fix is to decide where the
remainder goes (keep it in the contract, or give it to one named party) and assert that instead.

## Common mistakes

- **Dividing before multiplying.** `(shares / totalShares) * balance` pays a minority holder `0`.
  Use `Math.mulDiv(shares, balance, totalShares)`.
- **Rounding toward the user.** Minting deposit shares with `Ceil`, or paying withdrawals with
  `Ceil`, leaks value every call. Floor what you give, ceil what you take.
- **`unchecked` around user input.** `unchecked { balance -= amount; }` lets a withdrawal wrap the
  balance to a huge number. Check first, or leave it checked.
- **`uint128(x)` on an unbounded value.** It truncates silently (`type(uint128).max + 5` becomes
  `4`). Use `SafeCast.toUint128`.
- **Assuming 18 decimals.** Many tokens use other decimals; scale every token amount to a common
  unit before combining, or you compare quantities that are not the same thing.

## Practice

1. Rewrite `fee = amount / 10000 * feeBps` so a small `amount` is not charged zero, rounding the
   fee up in the protocol's favour.
2. A vault mints `shares = Math.mulDiv(assets, totalShares, totalAssets)` on deposit. Which
   rounding direction keeps it safe, and why?
3. `uint64 public count; count += uint64(n);` where `n` is a user-supplied `uint256`. What goes
   wrong, and how do you fix it?

### Answers

1. `Math.mulDiv(amount, feeBps, 10000, Math.Rounding.Ceil)`. Multiplying first keeps the
   precision, and `Ceil` means a tiny amount still pays at least 1 wei of fee rather than nothing.
2. `Floor` (the default). Rounding the minted shares down means a depositor never receives shares
   worth more than they paid, so existing holders are not diluted; the dust stays in the vault.
3. `uint64(n)` truncates any `n` above `2**64 - 1`, so `count` can be far smaller than the real
   total and the accounting breaks. Use `count += SafeCast.toUint64(n);`, which reverts on an
   out-of-range `n`.

## Key takeaways

- Integer division truncates toward zero; multiply before you divide, and scale by 1e18.
- `Math.mulDiv` avoids intermediate overflow and lets you pick `Floor` or `Ceil`.
- Round in the protocol's favour: floor what you pay, ceil what you charge.
- `unchecked` wraps silently and narrowing casts truncate silently; use checks and `SafeCast`.
- Fuzz the arithmetic property; the counterexample shows you the exact input that breaks it.

## Further reading

- [Solidity documentation: Checked or Unchecked Arithmetic](https://docs.soliditylang.org/en/latest/control-structures.html#checked-or-unchecked-arithmetic)
- [OpenZeppelin Contracts 5.x: Math (mulDiv, Rounding) and SafeCast](https://docs.openzeppelin.com/contracts/5.x/api/utils#math)
- [OWASP Smart Contract Top 10: 2026, SC07 Arithmetic Errors](https://scs.owasp.org/sctop10)
