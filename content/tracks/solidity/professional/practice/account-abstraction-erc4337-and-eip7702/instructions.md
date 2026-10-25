Complete `StudioDelegate` in `solution.sol`. EOAs delegate to it with EIP-7702, so its code runs
as the EOA: `address(this)` is the EOA, and the balance is the EOA's. The `Call` struct, the
errors, the immutable `entryPoint` and the constructor are written for you. Keep the contract
stateless: do not add storage variables (a value a constructor writes to storage stays in the
delegate contract's own storage, where no delegated EOA ever sees it).

1. **`receive() external payable`** accepts plain ether payments. Without it, a delegated EOA
   rejects every payment, because every call to it now runs this code.
2. **`function execute(Call[] calldata calls) external payable`**
   - Only the account itself (`address(this)`) or `entryPoint` may call it. Anyone else:
     `Unauthorized(msg.sender)`.
   - Makes each call in order, with its `value` and `data`. If call number `i` (counting from 0)
     fails, revert with `CallFailed(i)`, which also undoes the calls before it.
3. **`function validateUserOp(PackedUserOperation calldata userOp, bytes32 userOpHash, uint256 missingAccountFunds) external returns (uint256 validationData)`**
   - Only `entryPoint` may call it. Anyone else: `Unauthorized(msg.sender)`.
   - Returns `0` if `userOp.signature` is a valid signature of `userOpHash` by the account itself
     (`address(this)`), and `1` otherwise. It never reverts because of a wrong or malformed
     signature: use `ECDSA.tryRecover`, not `ECDSA.recover`.
   - Then, if `missingAccountFunds` is above zero, sends that much ether to `msg.sender` (the
     EntryPoint) with `call`, and reverts with `PrefundFailed()` if the call fails.

```solidity
StudioDelegate impl = new StudioDelegate(entryPoint);
vm.signAndAttachDelegation(address(impl), inesKey); // the next call carries the authorization

StudioDelegate.Call[] memory calls = new StudioDelegate.Call[](2);
calls[0] = StudioDelegate.Call(supplier, 0.5 ether, "");
calls[1] = StudioDelegate.Call(fixer, 0.25 ether, "");
vm.prank(ines);
StudioDelegate(payable(ines)).execute(calls);      // both are paid from Ines's balance

vm.prank(mallory);
StudioDelegate(payable(ines)).execute(calls);      // reverts with Unauthorized(mallory)

vm.prank(entryPoint);
StudioDelegate(payable(ines)).validateUserOp(op, hash, 0); // 0 when Ines signed hash, 1 otherwise
```

`StudioDelegate(payable(ines))` needs `payable` because the contract has a `receive` function.
