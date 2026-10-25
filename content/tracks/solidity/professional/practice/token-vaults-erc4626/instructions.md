Complete `BandFundVault` in `solution.sol`. It inherits OpenZeppelin 5.7's `ERC4626`, which already
does the share math, the transfers and the events; you change only the functions marked with a
task. Keep the constructor, the constants and the two fee helpers.

1. **Virtual shares.** Override `_decimalsOffset()` to return `3`. The fund's shares then have
   21 decimals (the band credit's 18 plus 3), an empty fund gives 1,000 shares per wei, and a
   donation attack costs the attacker about a thousand times what it takes from a victim.
2. **The cap.** The fund never accepts deposits that would take `totalAssets()` above `cap`.
   - `maxDeposit(address)` returns `cap - totalAssets()`, or `0` when the fund already holds
     `cap` or more. Credits sent straight to the fund count, so do not underflow.
   - `maxMint(address receiver)` returns `previewDeposit(maxDeposit(receiver))`: the shares that
     the remaining room buys, rounded down.
   `ERC4626`'s `deposit` and `mint` already revert with
   `ERC4626ExceededMaxDeposit(receiver, assets, max)` and `ERC4626ExceededMaxMint` when the
   amount is above these limits.
3. **The exit fee**, `EXIT_FEE_BPS` = 50 basis points (0.5%), paid in credits to `treasury`:
   - `previewWithdraw(uint256 assets)`: the shares to burn for `assets` **net** to the member,
     which must also cover the fee: `super.previewWithdraw(assets + _feeOnRaw(assets))`.
   - `previewRedeem(uint256 shares)`: the credits the member gets for `shares` after the fee:
     `assets - _feeOnTotal(assets)`, where `assets = super.previewRedeem(shares)`.
   - `_withdraw(caller, receiver, owner, assets, shares)`: work out `_feeOnRaw(assets)`, call
     `super._withdraw(...)` (it burns the shares and pays `assets` to the receiver), then send
     the fee to `treasury` with `SafeERC20.safeTransfer` when it is not zero.

   Both helpers round **up**, so the fee is never smaller than 0.5%: even a 1 wei withdrawal
   pays a 1 wei fee. `ERC4626` builds `withdraw`, `redeem` and `maxWithdraw` on these three
   functions, so every one of them agrees with the previews.

```solidity
BandFundVault fund = new BandFundVault(credit, treasury, 5_000e18);
fund.decimals();                       // 21
// as ada, who holds 1,000 credits and approved the fund:
fund.deposit(1_000e18, ada);           // 1_000e21 shares
fund.maxDeposit(ada);                  // 4_000e18: room left under the cap
fund.withdraw(100e18, ada, ada);       // burns 100_500e18 shares: ada gets 100 credits, the treasury 0.5
fund.redeem(fund.balanceOf(ada), ada, ada); // 895024875621890547263: 899.5 credits' worth, net of the fee
```
