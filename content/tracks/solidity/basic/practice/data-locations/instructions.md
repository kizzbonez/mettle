`BoatLog` in `solution.sol` records the club's outings. Adding boats works; logging them does not
yet. Keep every name, signature and error as it is.

1. **Fix `_record`.** It finds the boat, adds the outing and the metres, and the transaction
   succeeds, but `boat(id)` still shows 0 outings afterwards. Make the additions land in storage.
2. **`function logOutings(uint256[] calldata ids, uint256[] calldata distances) external`** logs
   `distances[i]` metres for boat `ids[i]`, for every `i`, by calling `_record`. Check first, in
   this order:
   - `LengthMismatch(ids.length, distances.length)` when the arrays differ in length;
   - `BatchTooLarge(ids.length, MAX_BATCH)` when there are more than 20 entries.

   An empty batch does nothing. If any entry is refused by `_record`, the whole batch is refused
   and no boat changes. The parameters are `calldata`: read them where they are, without copying.
3. **At most 25 outings per transaction.** Declare `uint256 transient loggedThisTx;` and, in
   `_record`, after its two checks, revert with `TooManyThisTransaction(MAX_PER_TX)` when 25
   outings have already been logged in this transaction; otherwise count the outing. The limit
   covers `logOuting` and `logOutings` together, and starts again at 0 in every new transaction.

```solidity
BoatLog club = new BoatLog();
club.addBoat("Kingfisher");                 // id 0
club.addBoat("Heron");                      // id 1
club.logOuting(0, 2000);                    // boat(0): 1 outing, 2000 metres

uint256[] memory ids = new uint256[](3);    // [0, 1, 0]
uint256[] memory distances = new uint256[](3); // [1500, 3000, 500]
// ... fill them, then:
club.logOutings(ids, distances);            // boat(0): 3 outings, 4000 metres
                                            // boat(1): 1 outing, 3000 metres
club.logOutings(ids, new uint256[](2));     // reverts with LengthMismatch(3, 2)
```

A contract that calls `logOutings` with 20 entries and then again with 6 in the same
transaction is refused with `TooManyThisTransaction(25)`; the same two batches sent as two
transactions are both logged.
