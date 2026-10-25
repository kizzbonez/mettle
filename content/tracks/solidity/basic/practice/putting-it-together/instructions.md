Complete `SupperTickets` in `solution.sol`. The state, events, errors, both modifiers,
`withdrawCredit`, `collectTakings` and the `_pay` helper are written; read them first, because
your functions follow the same habits. The deployer is the organiser and sets the seat `price`
(in wei) and the hall's `capacity`. The sale starts in `Stage.OnSale`.

1. **`buy(uint256 seats) external payable`**, only while on sale (its modifier is in place).
   Check in this order:
   - `seats` of 0 reverts with `ZeroSeats()`;
   - more seats than are left reverts with `NotEnoughSeats(requested, available)`, where
     `available` is `capacity - seatsSold` (buying exactly the last seats is fine);
   - paying less than `seats * price` reverts with `Underpaid(sent, cost)`.

   Then add the seats to `seatsSold` and to the buyer's `seatsOf`, credit anything paid above
   the cost to the buyer's `credit` (it is withdrawn later with `withdrawCredit`; nothing is sent
   from `buy`), and emit `TicketsBought(buyer, seats, cost)`.
2. **`cancel() external`**: only the organiser (`NotOrganiser(caller)` for anyone else), and only
   while on sale (`WrongStage(current)` otherwise, so a sale cannot be cancelled twice or after
   the takings were collected). It moves the sale to `Stage.Cancelled` and emits
   `SaleCancelled()`. Put the two modifiers in that order: `onlyOrganiser atStage(...)`.
3. **`claimRefund() external`**: only once the sale is cancelled (`WrongStage(current)`
   otherwise). The refund is the buyer's seats times `price`; if that is 0, revert with
   `NothingToPay()`. Clear the buyer's seats **before** paying with `_pay`, then emit
   `Refunded(buyer, amount)`. Change in `credit` is separate and stays where it is.

Example, with a price of 0.02 ether and 50 seats:

```solidity
vm.prank(ada);
tickets.buy{value: 0.07 ether}(3);   // emits TicketsBought(ada, 3, 0.06 ether); credit(ada) is 0.01 ether
vm.prank(bo);
tickets.buy{value: 0.04 ether}(2);   // seatsSold() is 5
vm.prank(organiser);
tickets.cancel();                    // emits SaleCancelled()
vm.prank(ada);
tickets.claimRefund();               // pays Ada 0.06 ether, emits Refunded(ada, 0.06 ether)
vm.prank(ada);
tickets.withdrawCredit();            // pays Ada her 0.01 ether of change
vm.prank(cy);
tickets.buy{value: 0.02 ether}(1);   // reverts with WrongStage(Stage.Cancelled)
```

Some buyers are contracts. Your refund must work for a contract whose `receive` needs more than
2300 gas, and a buyer that calls `claimRefund` again from inside its `receive` must not be paid
twice.
