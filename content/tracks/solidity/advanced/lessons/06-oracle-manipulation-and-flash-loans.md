---
title: Oracle Manipulation and Flash Loans
summary: See why a flash loan gives any attacker millions for one transaction, how that money moves a pool's spot price far enough to drain a lender that trusts it, and how to read a price safely from a time-weighted average or a checked price feed.
minutes: 35
objectives:
  - Explain an ERC-3156 flash loan and write a receiver that checks its lender and initiator
  - Show with a test how a spot price read from a pool is moved inside one transaction
  - Explain why a time-weighted average price resists a one-transaction manipulation
  - Read a Chainlink-style feed safely, rejecting stale and non-positive answers and scaling its decimals
---

## Outline

1. Flash loans: free capital for one transaction
2. A price read from a pool
3. Moving the price and draining the lender
4. Time-weighted average prices
5. Price feeds: staleness and decimals
6. Choosing a price source

## Flash loans: free capital for one transaction

A **flash loan** lends as much as the lender holds, without collateral, if it is repaid with a
fee before the same transaction ends; otherwise the whole transaction reverts, so the lender
takes no risk. **ERC-3156** standardises it: `flashLoan(receiver, token, amount, data)` sends
the tokens, calls the receiver's `onFlashLoan(initiator, token, amount, fee, data)`, then pulls
back `amount + fee` with `transferFrom`. OpenZeppelin's `ERC20FlashMint` makes a token lend
itself:

```solidity
function onFlashLoan(address initiator, address token, uint256 amount, uint256 fee, bytes calldata)
    external
    returns (bytes32)
{
    if (msg.sender != address(lender)) revert UntrustedLender(msg.sender);
    if (initiator != address(this)) revert UntrustedInitiator(initiator);
    console.log("COIN held during the loan", ERC20(token).balanceOf(address(this)) / 1e18);
    // ... swap, deposit, borrow: anything, as long as it ends in this transaction ...
    ERC20(token).approve(msg.sender, amount + fee); // the lender pulls the repayment
    return keccak256("ERC3156FlashBorrower.onFlashLoan");
}
```

```text
[PASS] test_a_million_for_one_transaction() (gas: 2083646)
Logs:
  COIN held during the loan 1000000
  COIN held afterwards 0
  fee charged 0
```

The test borrows a million COIN, then logs the balance and the fee. The two checks at the top
protect your own receivers: anyone can call `onFlashLoan`, and anyone can start a loan *naming
your contract as the receiver*. The lesson for defenders is bigger: never assume an attack is
too expensive because it "needs a lot of money". For one transaction, everyone has a fortune.

## A price read from a pool

An **oracle** is whatever tells a contract a fact from outside it, most often a price. The
tempting oracle is a pool already on chain: a constant-product pool holding two tokens keeps
`grain * coin` constant when it trades (Professional 05 builds one), and its **spot price**, the
ratio of its reserves, is free to read. Here a lender values GRAIN collateral at that price:

```solidity
contract GrainPool {
    uint256 public grain = 1_000e18;
    uint256 public coin = 2_000e18;

    /// @notice COIN per GRAIN right now, scaled by 1e18.
    function spotPrice() public view returns (uint256) {
        return coin * 1e18 / grain;
    }

    function buyGrain(uint256 coinIn) external returns (uint256 grainOut) {
        grainOut = grain * coinIn / (coin + coinIn);
        coin += coinIn;
        grain -= grainOut;
    }
    // sellGrain is the mirror image
}

contract NaiveLender {
    GrainPool public immutable pool;

    constructor(GrainPool pool_) {
        pool = pool_;
    }

    /// @notice Lends COIN worth half the GRAIN deposited, at the pool's spot price.
    function maxBorrow(uint256 grainCollateral) public view returns (uint256) {
        return grainCollateral * pool.spotPrice() / 1e18 / 2;
    }
}
```

## Moving the price and draining the lender

The attack test plays the attacker: flash-borrow 18,000 COIN, buy GRAIN with all of it, deposit
100 GRAIN and borrow the limit, sell the rest of the GRAIN back, repay the loan.

```solidity
console.log("price before", pool.spotPrice() / 1e18);
console.log("limit on 100 GRAIN before", lender.maxBorrow(100e18) / 1e18);
uint256 loan = 18_000e18; // flash-loaned COIN
uint256 grainBought = pool.buyGrain(loan);
console.log("price after buying", pool.spotPrice() / 1e18);
uint256 borrowed = lender.maxBorrow(100e18); // 100 GRAIN deposited as collateral
console.log("limit on 100 GRAIN now", borrowed / 1e18);
uint256 coinBack = pool.sellGrain(grainBought - 100e18);
console.log("COIN left after repaying the loan", (coinBack + borrowed - loan) / 1e18);
```

```text
Logs:
  price before 2
  limit on 100 GRAIN before 100
  price after buying 200
  limit on 100 GRAIN now 10000
  COIN left after repaying the loan 9777
```

One swap moved the price a hundredfold, the lender handed over 10,000 COIN for collateral worth
200, and the pool's price was restored before the transaction ended. This is **oracle
manipulation**, SC02 in the OWASP Smart Contract Top 10 (2025), with flash loan attacks at SC07.
In October 2020 an attacker moved a stablecoin pool with flash-loaned money, again and again, to
trade with Harvest Finance's vaults at skewed prices; about 34 million dollars left in minutes.

## Time-weighted average prices

A **TWAP** (time-weighted average price) averages the price over a window. The pool keeps an
**accumulator**, the running sum of `price * seconds` that each price was in force, updated
*before* every trade changes the reserves:

```solidity
function cumulativeNow() public view returns (uint256) {
    return priceCumulative + spotPrice() * (block.timestamp - lastUpdate);
}
// first lines of buyGrain:
priceCumulative = cumulativeNow(); // record the old price first
lastUpdate = block.timestamp;
```

The consumer saves an observation `(cumulative, time)` and later divides the difference by the
seconds between them. With a 30-minute window, the same 18,000 COIN swap, logging the spot price
and a hundred times the TWAP:

```text
Logs:
  spot 200 twap x100 200
  spot 200 twap x100 331
```

In the swap's own block the average is still 2.00: the new price has been in force for zero
seconds. Holding it one 12-second block lifts the average only to 3.31, and holding it at all
means keeping it across blocks, which a flash loan cannot do and arbitrage traders punish. A
TWAP is only as strong as its window and its pool: in April 2022 Inverse Finance lost
about 15.6 million dollars when a TWAP that sampled a thinly traded pool was moved with real
capital.

## Price feeds: staleness and decimals

A **price feed** (Chainlink's are the common example) is a contract that independent node
operators update with prices from many markets: when the price moves past a **deviation
threshold**, and at least once per **heartbeat**. You read it with
`latestRoundData()`, which returns `(roundId, answer, startedAt, updatedAt, answeredInRound)`.
Check three things every time:

```solidity
function price() public view returns (uint256) {
    (, int256 answer,, uint256 updatedAt,) = feed.latestRoundData();
    if (answer <= 0) revert BadPrice(answer);
    if (updatedAt == 0 || block.timestamp - updatedAt > MAX_AGE) {
        revert StalePrice(updatedAt, block.timestamp);
    }
    return uint256(answer) * 10 ** (18 - feed.decimals());
}
```

The answer is a signed integer and may be zero or negative after a fault. An answer that is
hours old describes a market that has moved on, so compare `updatedAt` with a `MAX_AGE` just
above the feed's heartbeat. Feeds have their own `decimals()` (8 is common for prices in
dollars), so scale to the 18 your arithmetic uses. `answeredInRound` was once compared with
`roundId` to detect an incomplete round; Chainlink now marks it deprecated, so do not rely on
it. In tests, a `MockFeed` with `set(answer, updatedAt)` returns whatever the test chose; the
first test below sets a fresh price, then warps two hours ahead:

```text
[FAIL: StalePrice(1, 7201)] test_a_feed_that_stopped() (gas: 89384)
[PASS] test_scales_a_fresh_price() (gas: 91605)
Logs:
  price 2000000000000000000
```

## Choosing a price source

Never price anything from a spot reserve or from `balanceOf(pool)`, which a donation also
moves. Prefer a checked feed, with a TWAP from a deep pool as a second opinion, and when the
price is unavailable, revert rather than lend at a wrong one.

## Common mistakes

- **Spot price as an oracle.** The lender above lent 10,000 COIN against 200 COIN of GRAIN.
  Use a checked feed or a TWAP.
- **No staleness check.** A feed that stopped updating keeps returning its last answer; without
  the `updatedAt` check the contract lends at it. Revert with `StalePrice`.
- **Ignoring decimals.** Treating an 8-decimal answer as 18 decimals undervalues collateral by a
  factor of 10^10. A feed with more than 18 decimals breaks `18 - decimals` with
  `panic: arithmetic underflow or overflow (0x11)`; divide instead in that case.
- **A flash loan receiver that trusts its caller.** Without the `msg.sender` and `initiator`
  checks, anyone can make your contract take loans, pay their fees and run its logic with their
  `data`.

## Practice

1. A pool like `GrainPool`, whose constructor takes the reserves, holds 500 GRAIN and 1,000
   COIN. What is its spot price after someone buys GRAIN with 4,000 COIN?
2. What does `price()` return for a feed with 6 decimals that answers `2_500_000`?
3. Write a test proving that a stranger who starts a flash loan naming your `Borrower` as the
   receiver is rejected.

### Answers

```solidity
function test_1_new_spot_price() public {
    Pool pool = new Pool(500e18, 1_000e18);
    pool.buyGrain(4_000e18); // 400 GRAIN out: 100 GRAIN and 5,000 COIN remain
    console.log("spot price", pool.coin() / pool.grain());
}

function test_2_six_decimals() public {
    MockFeed feed = new MockFeed(6);
    feed.set(2_500_000, block.timestamp);
    console.log("price", new FeedReader(feed).price());
}

function test_3_a_stranger_starts_our_loan() public {
    Coin coin = new Coin();
    Borrower borrower = new Borrower(coin);
    vm.prank(address(0xBAD));
    vm.expectRevert(abi.encodeWithSelector(Borrower.UntrustedInitiator.selector, address(0xBAD)));
    coin.flashLoan(borrower, address(coin), 1_000e18, "");
}
```

```text
[PASS] test_1_new_spot_price() (gas: 346736)
Logs:
  spot price 50

[PASS] test_2_six_decimals() (gas: 865184)
Logs:
  price 2500000000000000000

[PASS] test_3_a_stranger_starts_our_loan() (gas: 2059440)
```

The lender passes `msg.sender` as the initiator, so the stranger's address reaches the receiver
and the check rejects it.

## Key takeaways

- A flash loan gives anyone huge capital for one transaction, so cost is no defence.
- A pool's spot price moves arbitrarily inside one transaction; never use it as an oracle.
- A long TWAP of a deep pool resists flash loans; only capital held across blocks moves it.
- Read feeds with `latestRoundData`, reject non-positive and stale answers, scale decimals.
- A flash loan receiver checks that its caller is the lender and the initiator is itself.

## Further reading

- [ERC-3156: Flash Loans](https://eips.ethereum.org/EIPS/eip-3156)
- [Chainlink Data Feeds API reference](https://docs.chain.link/data-feeds/api-reference)
- [OWASP Smart Contract Top 10 (2025)](https://owasp.org/www-project-smart-contract-top-10/)
