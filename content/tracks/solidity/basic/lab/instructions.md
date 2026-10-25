Write `InstrumentLibrary` in `solution.sol`. The starter declares the struct, the state, the
events and the errors with the exact names the tests use, and writes the constructor, the
`onlyLibrarian` modifier and `setMember` for you: keep them. You may add private helper functions
of your own. All amounts are in wei.

The deployer is the `librarian`. An instrument's id is its number in the catalogue: the first one
added is 1, and `instrumentCount` is the highest id so far. `instruments(id)` returns its name,
deposit and borrower; the borrower is `address(0)` while the instrument is on the shelf.

**The books.** Four numbers must always describe every wei the contract holds:
`address(this).balance == depositsHeld + totalCredit + fees`. `depositsHeld` is the sum of the
deposits of the instruments out on loan, `credit[account]` is what an account may withdraw
(`totalCredit` is the sum of all credit) and `fees` are damage fees the librarian has not taken
yet. The tests check this after every step, with random amounts.

1. **Modifiers.**
   - `onlyMember()` reverts with `NotMember(msg.sender)` unless `isMember[msg.sender]` is true.
   - `knownInstrument(uint256 id)` reverts with `UnknownInstrument(id)` unless `id` is from 1 to
     `instrumentCount`.
2. **`addInstrument(string calldata name, uint256 deposit) external onlyLibrarian returns (uint256 id)`**:
   a deposit of 0 reverts with `ZeroDeposit()`. Otherwise store the instrument under the next id,
   on the shelf, emit `InstrumentAdded(id, name, deposit)` and return the id.
3. **`borrow(uint256 id) external payable onlyMember knownInstrument(id)`**, with the modifiers in
   that order. Then, in this order:
   - an instrument that is out reverts with `AlreadyOnLoan(id, currentBorrower)`;
   - paying less than its deposit reverts with `DepositTooLow(sent, required)`;
   - record the caller as the borrower, add the deposit to `depositsHeld`, credit anything paid
     above the deposit to the caller, and emit `Borrowed(id, borrower, deposit)`.

   A member may borrow several instruments. Nothing is sent from `borrow`.
4. **`checkIn(uint256 id, uint256 fee) external onlyLibrarian knownInstrument(id)`**: an
   instrument on the shelf reverts with `NotOnLoan(id)`; a fee above the deposit reverts with
   `FeeTooHigh(fee, deposit)` (a fee equal to the deposit is allowed). Then put the instrument
   back on the shelf, take its deposit out of `depositsHeld`, add the fee to `fees`, credit the
   rest of the deposit to the borrower, and emit `CheckedIn(id, borrower, fee)`. Do **not** send
   ether here: a borrower whose wallet refuses ether must not be able to block a check-in.
5. **`withdraw() external`**: with no credit, revert with `NothingToWithdraw()`. Otherwise set the
   caller's credit to 0 and reduce `totalCredit` **before** sending, send the whole amount with
   `call` and revert with `TransferFailed(to, amount)` if it fails, then emit
   `Withdrawn(account, amount)`. Never use `transfer` or `send`: some members are contract
   wallets whose `receive` needs more than 2300 gas.
6. **`withdrawFees(address to) external onlyLibrarian`**: with no fees, revert with
   `NothingToWithdraw()`. Otherwise set `fees` to 0, send the fees to `to` in the same way
   (`TransferFailed(to, amount)` on failure) and emit `FeesWithdrawn(to, amount)`.

A rehearsal evening, with the test contract as the librarian and Ada at `address(0xA11CE)`:

```solidity
InstrumentLibrary lib = new InstrumentLibrary();
lib.addInstrument("cello", 0.5 ether);      // returns 1, emits InstrumentAdded(1, "cello", 0.5 ether)
lib.addInstrument("flute", 0.2 ether);      // returns 2
lib.setMember(ada, true);

vm.prank(ada);
lib.borrow{value: 0.6 ether}(1);            // emits Borrowed(1, ada, 0.5 ether)
// credit(ada) == 0.1 ether, depositsHeld() == 0.5 ether
vm.prank(ada);
lib.borrow{value: 0.2 ether}(2);            // depositsHeld() == 0.7 ether

lib.checkIn(1, 0.05 ether);                 // emits CheckedIn(1, ada, 0.05 ether)
// credit(ada) == 0.55 ether, fees() == 0.05 ether, depositsHeld() == 0.2 ether

vm.prank(ada);
lib.withdraw();                             // pays Ada 0.55 ether, emits Withdrawn(ada, 0.55 ether)
lib.withdrawFees(address(0xF00D));          // pays 0.05 ether, emits FeesWithdrawn(0xF00D, 0.05 ether)
// address(lib).balance == 0.2 ether: the flute's deposit, still on loan

vm.prank(address(0xB0B));
lib.borrow{value: 0.5 ether}(1);            // reverts with NotMember(0xB0B)
vm.prank(ada);
lib.borrow{value: 0.2 ether}(2);            // reverts with AlreadyOnLoan(2, ada)
```

**Tips.** Write the modifiers and `addInstrument` first and run the visible test after each
step. A small private helper that credits an account and `totalCredit` together, and another that
sends ether and checks the result, keep the books right in every function. Work through each
function in the order checks, effects, interactions.
