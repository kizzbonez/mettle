Complete `BerryBaskets` in `solution.sol`. Its constants, state, constructor and errors are
written for you: keep their names. Amounts are in wei.

1. **`function priceOf(uint256 baskets) public pure returns (uint256 total)`** returns the price
   of one order.
   - Revert with `NoBaskets()` when `baskets` is 0, then with
     `OrderTooLarge(baskets, MAX_PER_ORDER)` when it is over `MAX_PER_ORDER` (8). These checks
     also keep the loop short.
   - The first basket costs `FIRST_BASKET_PRICE` (0.01 ether). Each further basket costs 10% less
     than the one before it, `previous * 9 / 10`, but never less than `FLOOR_PRICE` (0.006 ether):
     once the discount would go below the floor, every remaining basket costs `FLOOR_PRICE`. Add
     the baskets up with a loop.
2. **`function reserve(uint256 baskets) external returns (uint256 cost)`** reserves baskets for
   today. Check in this order and revert with the first that applies:
   - `NoBaskets()` when `baskets` is 0;
   - `OrderTooLarge(baskets, MAX_PER_ORDER)` when `baskets` is over 8;
   - `SoldOut(left, baskets)` when fewer than `baskets` baskets are left, where `left` is
     `DAILY_LIMIT - reserved` (the day has 60 baskets). An order that takes exactly the last
     baskets is fine.

   Otherwise add `baskets` to `reserved`, add the order's `priceOf` to `owed`, and return that
   price. Anyone may reserve.
3. **`function closeDay() external returns (uint256 takings)`** ends the day. Revert with
   `NotFarmer(msg.sender)` unless the caller is `farmer` (whoever deployed the contract).
   Otherwise return the day's `owed`, and set both `reserved` and `owed` back to 0.

A failed call must leave `reserved` and `owed` as they were.

```solidity
BerryBaskets day = new BerryBaskets(); // you are the farmer
day.priceOf(1);   // 0.01 ether
day.priceOf(3);   // 0.01 + 0.009 + 0.0081 = 0.0271 ether
day.priceOf(6);   // ... + 0.00729 + 0.006561 + 0.006 (the floor) = 0.046951 ether
day.reserve(3);   // returns 0.0271 ether; reserved is 3, owed is 0.0271 ether
day.reserve(0);   // reverts with NoBaskets()
day.reserve(9);   // reverts with OrderTooLarge(9, 8)
day.closeDay();   // returns 0.0271 ether; reserved and owed are 0 again
```

The sixth basket would cost 0.0059049 ether after the discount, which is under the floor, so it
costs 0.006 ether, and so does every basket after it.
