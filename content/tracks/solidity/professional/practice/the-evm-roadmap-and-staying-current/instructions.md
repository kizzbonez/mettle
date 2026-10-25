`solution.sol` is the climbing wall's locker deposit box as it was written in 2021. It still
compiles, with warnings, but several of its assumptions stopped being true with later forks and
compiler releases. Modernise `LockerDeposits` without changing its public functions or state
variables, using the errors already declared:

1. **Custom errors instead of revert strings.** `deposit` with no ether reverts with
   `NothingSent()`; `withdraw` of more than the caller's deposit with
   `InsufficientDeposit(available, needed)`; `close` by anyone but `owner` with
   `NotOwner(msg.sender)`.
2. **Every kind of account may deposit.** Remove the `code.length == 0` check: smart contract
   wallets, and EOAs that delegated to code with EIP-7702, are members too.
3. **Pay with `call`.** `transfer` forwards only 2,300 gas, which a smart wallet's `receive`
   cannot work with, and is deprecated. Send with `call{value: ...}("")` and revert with
   `PaymentFailed()` if it fails.
4. **A transient lock.** Replace the storage lock with `bool private transient locked;`. The
   modifier reverts with `Reentrant()` when it is set, sets it, runs the function and clears it
   again: a delegated EOA can call `withdraw` twice in one transaction. A `withdraw` then writes
   only the caller's deposit to storage.
5. **Close without `selfdestruct`.** Since EIP-6780 (Cancun), `selfdestruct` no longer removes a
   contract created in an earlier transaction, so the old `close` left a box that kept taking
   deposits. Now `close` (owner only) sets `closed`, sends the whole balance to `owner` with
   `call` (`PaymentFailed()` if that fails), and from then on `deposit` reverts with `Closed()`.

```solidity
vm.prank(clubOwner);
LockerDeposits box = new LockerDeposits();        // clubOwner is the owner
// as ann
box.deposit{value: 0.3 ether}();
box.withdraw(0.1 ether);                          // deposits(ann) is 0.2 ether
// a contract wallet whose receive() writes to storage
wallet.depositTo(box, 0.5 ether);                 // was refused: "people only, no contracts"
wallet.withdrawFrom(box, 0.5 ether);              // failed with transfer's 2,300 gas
// as clubOwner
box.close();                                      // clubOwner receives the 0.2 ether left
// as ann
box.deposit{value: 0.1 ether}();                  // reverts with Closed()
```
