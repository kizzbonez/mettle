`solution.sol` holds the credit union's three contracts, as deployed:

- `Roles`, an abstract base with the two roles: the `owner` (the board, whoever deployed the
  contract) and the `treasurer`, with `onlyOwner` and `onlyTreasurer`.
- `SavingsPool is Roles`: members `deposit()` ether and receive shares; the treasurer's
  `addInterest()` adds ether without new shares, so every share becomes worth more;
  `withdraw(assets)` takes `assets` wei out and burns the shares they are worth.
- `BonusDesk is Roles`: holds ether from the board and pays bonuses into members' savings
  (`pool.depositFor`) on vouchers that the treasurer signs off chain.

Keep every contract, function, parameter, event and error. You may add imports, inheritance,
modifiers and private helpers. The auditors' four findings, each reproduced by a hidden test:

1. **Reentrancy in `withdraw`.** It sends the ether before it updates `sharesOf`,
   `totalShares` and `totalAssets`, so a contract can call `withdraw` again from its `receive`
   and be paid again for the same shares. Update the state before the payment
   (checks-effects-interactions); a reentrancy guard on top is fine. A failed payment still
   reverts with `PaymentFailed()`, and `Withdrawn(member, assets, shares)` is still emitted.
2. **Anyone can appoint the treasurer.** `setTreasurer` has no access check, and the treasurer
   signs bonuses. Only the owner may call it; anyone else gets `NotOwner(caller)`. It still
   emits `TreasurerChanged(previous, next)`.
3. **Bonus vouchers can be replayed.** A voucher is accepted again and again, on any copy of
   the desk, on any chain and after its deadline. Make `BonusDesk` inherit OpenZeppelin's
   `EIP712` (name `"BonusDesk"`, version `"1"`) and `Nonces`. `bonusDigest(member, amount,
   nonce, deadline)` returns `_hashTypedDataV4` of
   `keccak256(abi.encode(BONUS_TYPEHASH, member, amount, nonce, deadline))` and becomes `view`.
   `claim` then, in this order: reverts with `Expired(deadline)` once `block.timestamp` is past
   the deadline (a voucher is still good at its deadline); recovers the signer with
   `ECDSA.recover` and reverts with `WrongSigner(recovered)` unless it is the treasurer; uses
   the member's nonce with `_useCheckedNonce(member, nonce)` (each member's vouchers are
   numbered 0, 1, 2... and are used in that order; a used or skipped nonce reverts with
   `InvalidAccountNonce(member, nextNonce)`); emits `BonusPaid(member, amount, nonce)`; and
   deposits the bonus with `pool.depositFor`.
4. **Rounding in `withdraw`.** Shares to burn are computed as
   `assets * totalShares / totalAssets`, which rounds **down**: once a share is worth more than
   1 wei, a small withdrawal burns no shares at all, so anyone can take ether out without
   savings. Round up instead: `Math.mulDiv(assets, totalShares, totalAssets, Math.Rounding.Ceil)`
   (OpenZeppelin `Math`, imported). If the caller has fewer shares than that, revert with
   `InsufficientShares(available, needed)`. Deposits keep rounding down, and a deposit worth
   less than one share still reverts with `ZeroShares()`.

The rest works and must keep working: the first deposit gets one share per wei; later deposits
get `msg.value * totalShares / totalAssets` shares; `addInterest` reverts with `NoMembers()`
while there are no shares and with `NotTreasurer(caller)` for anyone but the treasurer;
`assetsOf(member)` is the member's shares times `totalAssets / totalShares`, rounded down; the
pool tracks `totalAssets` itself, so it always equals the ether it holds.

The example, as the visible test runs it (the test contract is the board):

```solidity
SavingsPool pool = new SavingsPool(treasurer);
BonusDesk desk = new BonusDesk(pool, treasurer);   // then funded with 5 ether
pool.deposit{value: 3 ether}();                    // alice: 3e18 shares
pool.addInterest{value: 1.5 ether}();              // treasurer: a share is now worth 1.5 wei
pool.assetsOf(alice);                              // 4.5 ether
pool.withdraw(1.5 ether);                          // alice: burns 1e18 shares, returns 1e18
pool.withdraw(1);                                  // a stranger: reverts InsufficientShares(0, 1)
bytes32 digest = desk.bonusDigest(alice, 0.3 ether, 0, 1 days);
// the treasurer signs digest with vm.sign; signature = abi.encodePacked(r, s, v)
desk.claim(alice, 0.3 ether, 0, 1 days, signature); // pool.assetsOf(alice) is now 3.3 ether
desk.claim(alice, 0.3 ether, 0, 1 days, signature); // reverts InvalidAccountNonce(alice, 1)
desk.setTreasurer(alice);                           // alice: reverts NotOwner(alice)
```

The hidden tests run each attack the auditors reproduced: a contract that re-enters
`withdraw`, a stranger who appoints himself treasurer and signs himself a bonus, vouchers
replayed ten times, as malleable twins, on another desk and on another chain, and two hundred
1-wei withdrawals by an account with no shares. They also fuzz deposits and withdrawals, check
that a withdrawal never lowers the value of a share, and check the EIP-712 digest by hand.
