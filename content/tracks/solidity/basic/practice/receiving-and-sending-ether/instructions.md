Complete `SavingsJar` in `solution.sol`. The state, the events and the errors are declared for
you. Amounts are in wei.

1. **`save() public payable`**: a call with no ether reverts with `ZeroAmount()`. Otherwise add
   `msg.value` to the caller's `savedBy` and to `totalSaved`, and emit
   `Saved(msg.sender, msg.value)`.
2. **`receive() external payable`**: a plain transfer counts as saving, with exactly the same
   rules and event as `save()` (a public function can be called from inside the contract).
3. **`fallback() external payable`**: a call to a function the jar does not have reverts with
   `UnknownCall()`, with or without ether.
4. **`withdraw(uint256 amount) external`**, in this order:
   - an amount of 0 reverts with `ZeroAmount()`;
   - more than the caller has saved reverts with `InsufficientSavings(saved, requested)`;
   - reduce the caller's `savedBy` and `totalSaved` **before** sending anything;
   - send the ether with `(bool ok, ) = msg.sender.call{value: amount}("")`; if `ok` is false,
     revert with `TransferFailed(msg.sender, amount)`, which undoes the whole withdrawal;
   - emit `Withdrawn(msg.sender, amount)`.

   Do not use `transfer` or `send`: members include club contracts whose `receive` needs more
   than 2300 gas.

Example, with Ada at `address(0xA11CE)` holding 2 ether:

```solidity
vm.prank(ada);
jar.save{value: 0.5 ether}();                         // emits Saved(ada, 0.5 ether)
vm.prank(ada);
(bool ok, ) = address(jar).call{value: 0.25 ether}(""); // ok; emits Saved(ada, 0.25 ether)
// jar.savedBy(ada) == 0.75 ether, jar.totalSaved() == 0.75 ether
vm.prank(ada);
jar.withdraw(0.5 ether);                              // emits Withdrawn(ada, 0.5 ether)
// ada.balance == 1.75 ether, address(jar).balance == 0.25 ether
vm.prank(ada);
jar.withdraw(1 ether);   // reverts with InsufficientSavings(0.25 ether, 1 ether)
```
