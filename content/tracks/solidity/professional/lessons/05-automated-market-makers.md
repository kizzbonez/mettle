---
title: Automated Market Makers
summary: Build and test a minimal constant-product automated market maker. Price swaps with x * y = k and a fee, mint and burn liquidity shares, measure price impact, protect traders with a minimum output and a deadline, and see why a pool's spot price must never be used as an oracle.
minutes: 45
objectives:
  - Derive the output of a swap from x * y = k with a 0.3% fee and implement it with correct rounding
  - Mint liquidity shares for the first and later deposits, and pay out a proportional part on removal
  - Measure price impact and protect a swap with a minimum output and a deadline
  - Explain why a pool's spot price is manipulable in one transaction, and test that k never falls
---

## Outline

1. Order books and automated market makers
2. The constant product
3. Swap math with a fee
4. Liquidity and shares
5. Price impact and slippage protection
6. The spot price is not an oracle
7. Testing the pool

## Order books and automated market makers

A traditional exchange keeps an **order book**: buyers and sellers post prices and a trade
happens when two orders meet. On Ethereum every order would be a transaction that costs gas, so
on-chain exchanges mostly use an **automated market maker** (AMM) instead: a contract, the
**pool**, holds reserves of two tokens and trades against anyone at a price set by a formula.
The reserves come from **liquidity providers** (LPs), who deposit both tokens, receive pool
shares, and earn the trading fees.

## The constant product

The simplest and most widely used formula keeps the product of the two reserves constant:

```text
x * y = k        x = reserve of token0, y = reserve of token1
```

A trader who adds `dx` of token0 may take out the `dy` of token1 that keeps the product:
`(x + dx) * (y - dy) = x * y`, so `dy = y * dx / (x + dx)`. The pool never runs out: as one
reserve shrinks, its price rises without limit. The **spot price** of token0 is `y / x`, the price
of an infinitely small trade.

## Swap math with a fee

The pool keeps a fee, 0.3% here, by pricing only 99.7% of the input while keeping all of it. The
reserves then grow with every trade, so `k` rises and the LPs' shares are worth more. With
integers, multiply first and round the output **down**, in the pool's favour:

```solidity
/// @notice Output for an exact input, after a 0.3% fee, rounded down.
function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure returns (uint256) {
    if (amountIn == 0) revert ZeroAmount();
    uint256 amountInWithFee = amountIn * 997;
    return amountInWithFee * reserveOut / (reserveIn * 1000 + amountInWithFee);
}

/// @notice Sells `amountIn` of token0 for token1; reverts if that gives less than `minAmountOut`.
function swap0For1(uint256 amountIn, uint256 minAmountOut) external returns (uint256 amountOut) {
    amountOut = getAmountOut(amountIn, reserve0, reserve1);
    if (amountOut < minAmountOut) revert InsufficientOutput(amountOut, minAmountOut);
    reserve0 += amountIn; // effects first
    reserve1 -= amountOut;
    token0.safeTransferFrom(msg.sender, address(this), amountIn); // then interactions
    token1.safeTransfer(msg.sender, amountOut);
}
```

The pool tracks its own `reserve0` and `reserve1` instead of reading `balanceOf`, so a token sent
straight to the pool (a donation) cannot move its price. Selling 100 apple tokens into a pool of
10,000 APL and 10,000 PEAR:

```text
out: 98715803439706129885
k before: 100000000000000000000000000000000000000000000
k after:  100002970385258968088161500000000000000000000
spot price: 980325167976266719
```

The trader got 98.72 PEAR, not 100: 0.3 APL of the input was the fee, and each further APL bought
a little less as the reserves moved, the **price impact**. `k` grew by the fee, and APL now costs
0.98 PEAR.

## Liquidity and shares

The pool is an ERC-20 itself; its tokens are the LP shares.

```solidity
function addLiquidity(uint256 amount0, uint256 amount1, uint256 minShares) external returns (uint256 shares) {
    uint256 supply = totalSupply();
    if (supply == 0) {
        shares = Math.sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY;
        _mint(address(0xdEaD), MINIMUM_LIQUIDITY); // locked forever: the pool is never empty
    } else {
        shares = Math.min(amount0 * supply / reserve0, amount1 * supply / reserve1);
    }
    if (shares == 0 || shares < minShares) revert InsufficientShares(shares, minShares);
    reserve0 += amount0;
    reserve1 += amount1;
    _mint(msg.sender, shares);
    token0.safeTransferFrom(msg.sender, address(this), amount0);
    token1.safeTransferFrom(msg.sender, address(this), amount1);
}
```

```text
shares: 9999999999999999999000 locked: 1000
```

- The **first** deposit sets the price and gets `sqrt(amount0 * amount1)` shares, the geometric
  mean, so a share's value does not depend on the ratio the first LP chose. 1,000 of them are
  minted to a dead address, as Uniswap v2 does, so the supply never returns to zero and the
  share-inflation trick of the previous lesson becomes expensive.
- **Later** deposits get shares in proportion. `Math.min` means a depositor who brings the tokens
  in the wrong ratio is credited for the smaller side, and the excess benefits the other LPs,
  so a deposit should match the current ratio.
- **Removing** burns shares for the same fraction of each reserve:
  `amount0 = shares * reserve0 / totalSupply`, rounded down.

LPs carry a risk: when the price moves, the pool sells the rising token and buys the falling one,
so they can end up worth less than if they had held the tokens. This is **impermanent loss**,
and the fees must pay for it.

## Price impact and slippage protection

The bigger the trade compared with the pool, the worse its average price. Average PEAR per APL
(times 10,000) for growing sales into the 10,000 / 10,000 pool:

```text
APL sold: 10 PEAR per APL x 10000: 9960
APL sold: 100 PEAR per APL x 10000: 9871
APL sold: 1000 PEAR per APL x 10000: 9066
APL sold: 5000 PEAR per APL x 10000: 6653
```

Between quoting a trade and its execution, the price can move: other trades land first, or a
**sandwich** attacker (Advanced 05) buys just before you and sells just after. So every swap takes
a **minimum output**, computed from a fresh quote minus the slippage the user accepts, and a
**deadline**, so a transaction that waits in the mempool for hours cannot execute at a stale
price (`if (block.timestamp > deadline) revert Expired(deadline);`). Asking for 99 PEAR where the
pool gives 98.7:

```text
[FAIL: InsufficientOutput(98715803439706129885 [9.871e19], 99000000000000000000 [9.9e19])] test_slippage_limit() (gas: 33382)
```

A `minAmountOut` of 0 means "any price", a gift to sandwich bots.

## The spot price is not an oracle

`reserve1 / reserve0` is the price right now, and anyone can change it in one transaction with
enough tokens or a flash loan (Advanced 06). One swap of 5,000 APL:

```text
spot price before: 1000000000000000000
spot price after one swap: 444889333778222667
```

A lending contract that valued collateral at this price could be drained within the same
transaction: move the price, borrow against it, swap back. Use a time-weighted average or an
oracle network, never the spot price of a pool.

## Testing the pool

The invariant that matters most: no swap may lower `k`.

```solidity
function testFuzz_k_never_decreases(uint256 amountIn) public {
    amountIn = bound(amountIn, 1, 100_000e18);
    uint256 kBefore = pool.reserve0() * pool.reserve1();
    pool.swap0For1(amountIn, 0);
    assertGe(pool.reserve0() * pool.reserve1(), kBefore, "k after a swap");
}
```

```text
[PASS] testFuzz_k_never_decreases(uint256) (runs: 256, μ: 102292, ~: 102116)
```

Also check that the reserves equal the token balances after every operation, and that adding and
then removing liquidity never returns more than was put in.

## Common mistakes

- **Pricing at the spot price.** `amountIn * reserveOut / reserveIn` ignores the curve, so a big
  trade empties the pool: in this lesson's lab, that attempt fails with `k after two swaps`.
- **Rounding the output up.** Every trade then takes a wei from the LPs; round outputs down.
- **No minimum output or deadline.** The swap succeeds at whatever price a sandwich leaves.
- **Reading `balanceOf` for the price.** A donation then moves the price without a trade; keep
  your own reserves.

## Practice

1. Compute `getAmountOut(1_000, 1_000_000, 1_000_000)` with and without the fee.
2. Why does the first deposit lock `MINIMUM_LIQUIDITY` shares?
3. Write `swap0For1` with a `deadline` parameter.

### Answers

1. With the fee, `1000 * 997 * 1_000_000 / (1_000_000 * 1000 + 1000 * 997) = 996`; without it,
   `1000 * 1_000_000 / 1_001_000 = 999`, both rounded down.
2. So the supply can never be zero again: one tiny share can no longer be pumped to an enormous
   value by a donation, and every later deposit is priced against real reserves.
3. The deadline is checked first; a test that warps to 1,000,001 and passes a deadline of
   1,000,000 fails as it should:

```solidity
function swap0For1(uint256 amountIn, uint256 minAmountOut, uint256 deadline) external returns (uint256 amountOut) {
    if (block.timestamp > deadline) revert Expired(deadline);
    amountOut = getAmountOut(amountIn, reserve0, reserve1);
    if (amountOut < minAmountOut) revert InsufficientOutput(amountOut, minAmountOut);
    reserve0 += amountIn;
    reserve1 -= amountOut;
    token0.safeTransferFrom(msg.sender, address(this), amountIn);
    token1.safeTransfer(msg.sender, amountOut);
}
```

```text
[FAIL: Expired(1000000 [1e6])] test_expired() (gas: 31441)
```

## Key takeaways

- A constant-product pool trades along `x * y = k`; its price is the reserve ratio.
- Price 99.7% of the input, round outputs down, and `k` grows with every trade.
- First LP: `sqrt(x * y)` shares minus a locked minimum; later LPs: proportional shares.
- Every swap needs a minimum output and a deadline.
- A pool's spot price can be moved in one transaction: it is not an oracle.

## Further reading

- [Uniswap v2 core: UniswapV2Pair.sol](https://github.com/Uniswap/v2-core/blob/master/contracts/UniswapV2Pair.sol)
- [Uniswap v2 periphery: UniswapV2Library.sol (getAmountOut)](https://github.com/Uniswap/v2-periphery/blob/master/contracts/libraries/UniswapV2Library.sol)
- [ethereum.org: Oracles](https://ethereum.org/developers/docs/oracles/)
