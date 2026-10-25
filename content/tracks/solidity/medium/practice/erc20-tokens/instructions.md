Write the co-op's share token, `KelpShare`, by hand. It declares that it implements `IERC20`,
so the events `Transfer` and `Approval` come from there, and it reuses OpenZeppelin's standard
errors from `IERC20Errors` (`ERC20InsufficientBalance`, `ERC20InvalidReceiver`,
`ERC20InvalidSpender`, `ERC20InsufficientAllowance`). The state, the metadata and the public
getters (`totalSupply`, `balanceOf`, `allowance`) are declared for you.

1. **`mint(address to, uint256 value)`** reverts with `NotSecretary(msg.sender)` unless the caller
   is `secretary`, and with `ERC20InvalidReceiver(address(0))` when `to` is the zero address.
   Otherwise it adds `value` to `totalSupply` and to `to`'s balance and emits
   `Transfer(address(0), to, value)`.
2. **`_move(address from, address to, uint256 value)`** (private) checks in this order: `to` is
   not the zero address (`ERC20InvalidReceiver(address(0))`), then `from` holds at least `value`
   (`ERC20InsufficientBalance(from, balance, value)`). Then it moves the units and emits
   `Transfer(from, to, value)`. A transfer of 0 is a normal transfer, and a transfer to yourself
   must leave your balance as it was.
3. **`transfer(address to, uint256 value) returns (bool)`** moves units from the caller with
   `_move` and returns `true`.
4. **`approve(address spender, uint256 value) returns (bool)`** reverts with
   `ERC20InvalidSpender(address(0))` for the zero address. Otherwise it **replaces** the caller's
   allowance for `spender` with `value`, emits `Approval(msg.sender, spender, value)` and returns
   `true`.
5. **`transferFrom(address from, address to, uint256 value) returns (bool)`** first spends the
   caller's allowance: with less than `value` approved it reverts with
   `ERC20InsufficientAllowance(msg.sender, allowance, value)`; otherwise the allowance goes down
   by `value`, except that an allowance of `type(uint256).max` means "unlimited" and never goes
   down. Then it moves the units with `_move` and returns `true`. It emits `Transfer` only, not
   `Approval`.

```solidity
KelpShare share = new KelpShare();                     // you are the secretary
share.mint(ana, 1_000);                                // 10.00 shares: decimals is 2
vm.prank(ana); share.transfer(ben, 250);               // ana 750, ben 250
vm.prank(ana); share.approve(market, 300);
vm.prank(market); share.transferFrom(ana, cal, 200);   // allowance(ana, market) is now 100
vm.prank(market); share.transferFrom(ana, cal, 101);   // ERC20InsufficientAllowance(market, 100, 101)
vm.prank(ben); share.transfer(cal, 251);               // ERC20InsufficientBalance(ben, 250, 251)
vm.prank(ben); share.transfer(ben, 250);               // ben still holds 250
```

Tip: in `_move`, read and write the sender's balance before you touch the receiver's.
