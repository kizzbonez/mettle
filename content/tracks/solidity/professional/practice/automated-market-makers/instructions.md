Complete `CreditPool` in `solution.sol`. The pool is an ERC-20 itself: its tokens are the
liquidity shares. `addLiquidity` is written for you; keep it, the state, the errors and the
events as they are. The pool keeps its own `reserveWater` and `reserveCompost` and never reads
token balances to price anything.

1. **`getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure`**
   - revert with `ZeroAmount()` when `amountIn` is 0, and with `InsufficientLiquidity()` when
     either reserve is 0;
   - otherwise return the constant-product output after the `FEE_BPS` (0.3%) fee, rounded down:
     `amountInWithFee = amountIn * (10_000 - FEE_BPS)`, then
     `amountInWithFee * reserveOut / (reserveIn * 10_000 + amountInWithFee)`.
2. **`swap(address tokenIn, uint256 amountIn, uint256 minAmountOut, uint256 deadline)`**, in this
   order:
   - revert with `Expired(deadline)` when `block.timestamp > deadline` (a deadline equal to now
     is fine);
   - revert with `UnknownToken(tokenIn)` unless `tokenIn` is `water` or `compost`;
   - price it with `getAmountOut` from the input side's reserve and the other side's reserve;
   - revert with `InsufficientOutput(amountOut, minAmountOut)` when the output is below the minimum;
   - add `amountIn` to the input reserve and subtract the output from the other reserve, **then**
     pull `amountIn` from the caller with `safeTransferFrom` and send the output with
     `safeTransfer`;
   - emit `Swapped(msg.sender, tokenIn, amountIn, amountOut)` and return the output.
3. **`removeLiquidity(uint256 shares, uint256 minWater, uint256 minCompost, uint256 deadline)`**
   returns `(waterOut, compostOut)`:
   - revert with `Expired(deadline)` as in `swap`, then with `ZeroAmount()` for 0 shares;
   - `waterOut = shares * reserveWater / totalSupply()`, and the same for compost (rounded down);
   - revert with `InsufficientOutput(waterOut, minWater)`, then
     `InsufficientOutput(compostOut, minCompost)`, when an output is below its minimum;
   - `_burn` the caller's shares (OpenZeppelin reverts with `ERC20InsufficientBalance` if they
     hold too few), lower both reserves, send both credits, and emit
     `LiquidityRemoved(msg.sender, waterOut, compostOut, shares)`.

```solidity
// the society adds 4,000 water and 9,000 compost
pool.addLiquidity(4_000e18, 9_000e18, 0);          // 6_000e18 - 1_000 shares: sqrt(4,000 * 9,000), minus the locked 1,000
pool.getAmountOut(250e18, 4_000e18, 9_000e18);     // 527916691180796611166 (527.9 compost)
// a trader sells 250 water and accepts no less than 520 compost, within a minute
pool.swap(address(water), 250e18, 520e18, block.timestamp + 60);
pool.reserveWater();                               // 4_250e18
// the society takes half its shares back
pool.removeLiquidity(shares / 2, 0, 0, block.timestamp); // 2124999999999999999645 water, 4236041654409601693710 compost
```
