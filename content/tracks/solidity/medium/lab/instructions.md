Write `solution.sol`. The starter declares the value type, the library, both contracts, their
state, events and errors, the `Auction` struct and two helpers, `auctionOf` and `_existing`.
Keep every name and signature; write the bodies and add the modifiers the rules need. Use
OpenZeppelin 5.7 (already imported) for ownership, the reentrancy guard and token transfers.

**The value type.** `Bps` is a `uint16` of basis points: 250 is 2.5%. `using BpsMath for Bps
global` lets you write `fee.applyTo(amount)` anywhere.

1. **`BpsMath.applyTo(Bps share, uint256 amount)`**: `amount * share / 10_000`, rounded down
   (multiply first). 2.5% of 120 HBC is 3 HBC; 0.01% of 9,999 wei is 0.
2. **`HarbourCredit.mint(address to, uint256 amount)`**: only the owner, the harbour master
   (`onlyOwner`); mints with `_mint`. A stranger gets `OwnableUnauthorizedAccount(stranger)`.
3. **SafeERC20.** In `FishAuction`, attach `SafeERC20` to `IERC20`; move tokens only with
   `credit.safeTransferFrom` and `credit.safeTransfer`.
4. **Fees.** `_setFee(newFee)` reverts with `FeeTooHigh(newFee)` above `MAX_FEE` (1,000 bps),
   emits `FeeChanged(oldFee, newFee)` and stores it; the constructor already calls it.
   `setFee(newFee)` is `onlyOwner` and calls `_setFee`. A fee change affects only catches
   listed afterwards.
5. **`list(uint256 reserve, uint256 duration) returns (uint256 id)`**: anyone may list. Revert
   with `ZeroDuration()` for a duration of 0. Ids count up from 1 (`auctionCount` is the last
   id). Store an `Auction` with `msg.sender` as seller, `endsAt = block.timestamp + duration`,
   **the current `fee`**, and the reserve; emit `Listed(id, seller, reserve, endsAt)`.
6. **`minimumBid(uint256 id)`**: `UnknownAuction(id)` through `_existing`. With no bid yet, the
   reserve, or 1 when the reserve is 0. Otherwise the highest bid plus
   `MIN_RAISE.applyTo(highestBid)`, or plus 1 when that raise rounds down to 0.
7. **`bid(uint256 id, uint256 amount)`**, `nonReentrant`, checks in this order:
   - the auction exists (`UnknownAuction(id)`);
   - `block.timestamp < endsAt`, otherwise `AuctionEnded(id)`;
   - the caller is not the seller (`SellerCannotBid()`);
   - `amount >= minimumBid(id)`, otherwise `BidTooLow(id, minimum)`.

   Then, before any token moves: credit the previous highest bid, if any, to its bidder in
   `withdrawable` (never send it back directly); record the new highest bidder and bid; if
   **less than** `EXTENSION` (5 minutes) is left (`endsAt - block.timestamp < EXTENSION`), set
   `endsAt = block.timestamp + EXTENSION`; emit `BidPlaced(id, bidder, amount, endsAt)` with the
   end as it now is. Last, pull the bid: `credit.safeTransferFrom(msg.sender, address(this), amount)`.
8. **`settle(uint256 id)`**: anyone; `UnknownAuction(id)`; before `endsAt` revert with
   `AuctionNotEnded(id, endsAt)`; a second time revert with `AlreadySettled(id)`. Mark it
   settled. With a winner, the fee is the auction's own `fee` applied to the highest bid: credit
   the seller the bid minus the fee and the **current owner** (`owner()`) the fee. Emit
   `Settled(id, winner, price, fee)`, which is `Settled(id, address(0), 0, 0)` when nobody bid.
9. **`withdraw()`**, `nonReentrant`: revert with `NothingToWithdraw()` when nothing is credited;
   otherwise zero the credit, emit `Withdrawn(account, amount)` and `safeTransfer` the amount.

The tests also use a token whose transfers call back into the auction: both `bid` and
`withdraw` must then revert with OpenZeppelin's `ReentrancyGuardReentrantCall()`.

**The morning at the quayside** (the visible test). The fee is 250 bps. At timestamp 1,000,000
the skipper lists a box with a reserve of 100 HBC for one hour, so it ends at 1,003,600:

| Time | Event | Result |
| --- | --- | --- |
| 1,000,000 | Ada bids 100 HBC | `BidPlaced(1, ada, 100e18, 1003600)` |
| | Ben bids 104 HBC | `BidTooLow(1, 105e18)`: 5% more is needed |
| | Ben bids 105 HBC | Ada is credited 100 HBC |
| 1,003,540 | Ada bids 120 HBC, one minute before the end | the end moves to 1,003,840; Ben is credited 105 HBC |
| 1,003,600 | `settle(1)` | `AuctionNotEnded(1, 1003840)` |
| 1,003,840 | `settle(1)` | `Settled(1, ada, 120e18, 3e18)`: the skipper is credited 117 HBC, the harbour master 3 HBC |

After everyone withdraws, Ada has 880 HBC of her 1,000, Ben his 1,000, the skipper 117 and the
harbour master 3, and the auction holds nothing.
