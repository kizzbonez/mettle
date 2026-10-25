`solution.sol` holds `PuppetShow`, a working draft that breaks three of the invariants below.
Keep every name, error, event and the order of the checks; change only what the three fixes
need.

**Threat model.** The *asset* is the ticket money the contract holds. The *actors* are ticket
holders, the organiser (who deploys the contract) and anyone else, including contracts. The
*trust boundaries* are every argument a caller chooses, such as the list of seats, and the
`call` that pays ether out. The invariants:

- **I1.** A holder is refunded at most once per seat they hold: `PRICE` for each seat they give
  up, never more.
- **I2.** Only the organiser can cancel the show or collect the takings.
- **I3.** Until the show starts, the contract keeps `PRICE` for every sold seat, so that a
  cancellation can always be refunded in full. After the start, the show can no longer be
  cancelled.

**Tasks**

1. **`refund(uint256[] calldata seats)`** breaks I1: ask what happens when a seat appears in the
   list twice, side by side or further apart. Make every repeat fail with
   `NotYourSeat(seat)`, for the repeated seat, while a list of distinct seats the caller holds
   still refunds `seats.length * PRICE` and emits `Refunded(holder, seats.length, amount)`.
2. **`collect(address to)`** breaks I2. Only the organiser may call it; anyone else gets
   `NotOrganiser(caller)`. The `onlyOrganiser` modifier already exists.
3. The timeline breaks I3. `collect` must revert with `ShowNotStarted()` while
   `block.timestamp < showStarts`, and `cancelShow` must revert with `TooLateToCancel()` once
   `block.timestamp >= showStarts`. In `collect`, keep the checks in this order:
   `onlyOrganiser`, `ShowWasCancelled()`, `ShowNotStarted()`, `AlreadyCollected()`.

Everything else stays as it is: `buy`'s rules (`SalesClosed()`, `NoSuchSeat(seat)`,
`SeatTaken(seat)`, `WrongPayment(sent)`, the `TicketSold` event), `NotCancelled()` before a
cancellation, and the `Collected(to, amount)` event with `amount = sold * PRICE`.

**Example.** The show starts at `showStarts`; Ada holds seat 7, Ben seats 8 and 9. Lists are
written `[8, 9]` for short; in a test they are `uint256[]` memory arrays.

```solidity
show.refund([8, 9]);            // as Ben, before any cancellation: reverts NotCancelled()
show.cancelShow();              // as the organiser, before the start
show.refund([8, 9]);            // as Ben: pays him 0.1 ether, emits Refunded(ben, 2, 0.1 ether)
show.refund([7, 7]);            // as Ada: reverts NotYourSeat(7)

// on another day, the show goes ahead:
show.collect(organiser);        // before the start: reverts ShowNotStarted()
show.collect(mallory);          // as Mallory, after the start: reverts NotOrganiser(mallory)
show.collect(organiser);        // as the organiser, after the start: sends 0.15 ether
show.cancelShow();              // now reverts TooLateToCancel()
```

The visible test shows the shape of an attack test: an attacker tries a step anyone may try
(`try ... {} catch {}` keeps the test going whether or not the step reverts), and the assertions
check the invariant afterwards. The hidden tests attack each invariant the same way.
