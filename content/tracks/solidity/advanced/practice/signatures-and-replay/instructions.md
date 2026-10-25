`solution.sol` holds `HarvestPay`, the version that was drained. It checks that the coordinator
signed `(picker, amount, nonce, deadline)`, but nothing stops the same voucher being cashed again,
on another copy of the contract or on another chain, after its deadline, or with garbage once
`retire()` has set `coordinator` to zero. Fix it. Keep every function, parameter, event and
error as they are.

1. **Typed data.** Make `HarvestPay` inherit OpenZeppelin's `EIP712` (name `"HarvestPay"`,
   version `"1"`) and `Nonces`, both already imported. `voucherDigest(picker, amount, nonce,
   deadline)` returns `_hashTypedDataV4` of the struct hash
   `keccak256(abi.encode(VOUCHER_TYPEHASH, picker, amount, nonce, deadline))`; it becomes `view`.
   The coordinator's app signs that digest.
2. **`redeem(picker, amount, nonce, deadline, signature)`**, in this order:
   - if `block.timestamp` is after `deadline`, revert with `Expired(deadline)` (a voucher is
     still good at its deadline);
   - recover the signer with `ECDSA.recover(digest, signature)`, which reverts on garbage and on
     malleable signatures instead of returning zero, and revert with `WrongSigner(recovered)`
     unless it is `coordinator`;
   - use the picker's nonce with `_useCheckedNonce(picker, nonce)`: each picker's vouchers are
     numbered 0, 1, 2... and must be cashed in that order, so a used or skipped nonce reverts
     with `InvalidAccountNonce(picker, nextNonce)`;
   - then emit `Paid(picker, amount, nonce)` and send the ether as before.
3. Anyone may submit a voucher; the money always goes to the picker it names.

```solidity
HarvestPay pay = new HarvestPay{value: 10 ether}(coordinator);
bytes32 digest = pay.voucherDigest(picker, 0.3 ether, 0, 1 days);
(uint8 v, bytes32 r, bytes32 s) = vm.sign(coordinatorKey, digest);
bytes memory voucher = abi.encodePacked(r, s, v);
pay.redeem(picker, 0.3 ether, 0, 1 days, voucher); // emits Paid(picker, 0.3 ether, 0)
pay.redeem(picker, 0.3 ether, 0, 1 days, voucher); // reverts with InvalidAccountNonce(picker, 1)
// the next voucher, signed with nonce 1, pays again
```

The hidden tests cash one voucher eleven times, submit its malleable twin, bring vouchers
signed for another `HarvestPay` and for another chain, try expired, stranger-signed and garbage
signatures (also after `retire()`), and check the digest against EIP-712 computed by hand.
