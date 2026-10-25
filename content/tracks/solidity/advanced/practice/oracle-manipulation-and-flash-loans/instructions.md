`solution.sol` holds the co-op's two contracts. `WattPool` is the co-op's WATT/COIN market (a
constant-product pool); leave it as it is. `CreditDesk` lends up to half the value of a member's
WATT. Everything in it is written except `wattPrice()`, which used to return
`pool.spotPrice()`: an attacker flash-borrowed COIN, bought WATT to push that price up a
hundredfold, borrowed against 100 WATT and sold the rest back, all in one transaction.

Write **`function wattPrice() public view returns (uint256)`** so that it returns the price of one
WATT in COIN, scaled to 18 decimals, read from `feed` (an `IPriceFeed`, the Chainlink-style
interface declared at the top of the file) and never from the pool:

1. Call `feed.latestRoundData()`, which returns
   `(roundId, answer, startedAt, updatedAt, answeredInRound)`; you need only `answer` and
   `updatedAt`.
2. If `answer` is zero or negative, revert with `BadPrice(answer)`.
3. Then, if `updatedAt` is zero, or the answer is more than `MAX_AGE` (one hour) old, revert with
   `StalePrice(updatedAt)`. An answer exactly `MAX_AGE` old is still accepted.
4. Otherwise return `answer` scaled from the feed's `decimals()` to 18 decimals. Feeds with 6, 8
   and 18 decimals must all work.

`maxBorrow` and `borrow` already call `wattPrice()`, so they will use your price. `poolPrice()`
stays as the website's display price and must not be used for lending.

```solidity
// The feed has 8 decimals and answers 2e8 (2.00000000 COIN per WATT), updated just now.
desk.deposit(100e18);       // a member deposits 100 WATT
desk.wattPrice();           // 2e18
desk.maxBorrow(member);     // 100e18: half of 100 WATT at 2 COIN
desk.borrow(60e18);         // the member receives 60 COIN
desk.borrow(41e18);         // reverts with OverLimit(41e18, 40e18)
// two hours later, with no new answer from the feed:
desk.maxBorrow(member);     // reverts with StalePrice(<the answer's updatedAt>)
```

The hidden tests replay the flash-loan attack (it must leave the desk's COIN untouched), make
large trades in the pool, and try stale, missing, zero and negative answers and feeds with
several decimals.
