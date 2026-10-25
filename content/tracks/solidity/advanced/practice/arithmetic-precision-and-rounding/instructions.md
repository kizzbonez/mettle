`solution.sol` holds `Granary`, a share fund. `deposit()` mints shares for ether and `redeem()`
pays ether for shares. The share ledger (`totalShares` and `sharesOf`) is `uint128`. Three
arithmetic flaws need fixing; keep every name, error and event, and keep rounding in the fund's
favour (members always get the floor). `Math` and `SafeCast` from OpenZeppelin are imported.

**Tasks**

1. **`redeem` pays without checking the balance, in an `unchecked` block.** A caller can redeem
   more shares than they hold: the subtraction wraps to a huge number and the fund pays out ether
   it does not owe. Add `if (shares > sharesOf[msg.sender]) revert InsufficientShares(held,
   shares)` (held first), then subtract normally (checked). A caller holding no shares who redeems
   any must revert.
2. **`redeem` divides before it multiplies**, so `(shares / totalShares) * balance` truncates to
   zero for anyone holding less than the whole supply. Compute the pay-out as
   `Math.mulDiv(shares, address(this).balance, totalShares)` instead: multiply before dividing,
   rounding down. A member who holds a quarter of the shares must get a quarter of the fund.
3. **`deposit` casts shares with `uint128(shares)`, which truncates silently.** A deposit larger
   than the `uint128` ledger can hold would record the wrong number of shares. Use
   `SafeCast.toUint128(shares)` (or `shares.toUint128()` with the `using` directive) so an
   over-range amount reverts instead. The same applies to the subtraction result in `redeem`.

**Example**

```solidity
granary.deposit{value: 4 ether}();   // alice: 4e18 shares, the fund holds 4 ether
granary.redeem(1 ether);             // alice: gets 1 ether, emits Redeemed(alice, 1e18, 1e18)
granary.redeem(4 ether);             // a non-member: reverts InsufficientShares(0, 4e18)
```

After a second member deposits 1 ether into a 3 ether fund they hold `1e18` of `4e18` shares;
redeeming all of them must pay exactly 1 ether, not 0.

The hidden tests over-redeem from a non-member, check a minority holder's precision, force an
odd-wei price to confirm the rounding direction, and fuzz that the fund never pays out more than
was deposited.
