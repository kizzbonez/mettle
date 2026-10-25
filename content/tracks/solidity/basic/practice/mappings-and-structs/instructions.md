Complete `CostumeWardrobe` in `solution.sol`. The enum, the struct, the state, the errors,
`costumeCount`, `allowCollector` and `availableIds` are written for you: keep their names.
`keeper` is whoever deployed the contract. In every function, check in the order given and
revert with the first error that applies.

1. **`function addCostume(uint256 id, string memory name) external`**
   - `NotKeeper(msg.sender)` unless the caller is `keeper`;
   - `CostumeExists(id)` when `costumes[id]` is not `Unknown`;
   - `WardrobeFull(MAX_COSTUMES)` when there are already 100 costumes.

   Then store a `Costume` with that name, `Available`, no hirer and `timesHired` 0, and push `id`
   to `costumeIds`. Any number can be an id, 0 included.
2. **`function hire(uint256 id, address member) external`** hires a costume for `member`:
   - `NoSuchCostume(id)` when the costume is `Unknown`;
   - `NotAllowed(member, msg.sender)` unless the caller is `member` itself or a collector that
     `member` allowed: `mayCollectFor[member][msg.sender]`;
   - `NotAvailable(id, status)` when it is not `Available`, with its current status;
   - `TooManyOnHire(member, MAX_ON_HIRE)` when `member` already has 2 costumes on hire.

   Then, through a storage reference, set the status to `OnHire`, the hirer to `member` (not the
   collector) and add one to `timesHired`; add one to `onHireBy[member]`.
3. **`function giveBack(uint256 id) external`**
   - `NoSuchCostume(id)` when it is `Unknown`;
   - `NotOnHire(id)` when it is not `OnHire`;
   - `NotHirer(id, msg.sender)` unless the caller is the hirer or `keeper`.

   Then take one from the hirer's `onHireBy`, make it `Available` and clear the hirer with
   `delete`. `timesHired` stays.
4. **`function retire(uint256 id) external`**
   - `NotKeeper(msg.sender)` unless the caller is `keeper`;
   - `NoSuchCostume(id)` when it is `Unknown`;
   - `NotAvailable(id, status)` when it is on hire.

   Then `delete` its record, so that the id reads as `Unknown` again and can be added anew, and
   remove `id` from `costumeIds` with swap-and-pop.

```solidity
CostumeWardrobe w = new CostumeWardrobe();   // you are the keeper
w.addCostume(1, "Lion");
w.addCostume(2, "Witch");
vm.prank(ada); w.allowCollector(bo, true);   // Ada lets Bo collect for her
vm.prank(bo);  w.hire(1, ada);               // Lion: OnHire, hirer Ada, timesHired 1
w.availableIds();                            // [2]
vm.prank(bo);  w.giveBack(1);                // reverts with NotHirer(1, bo)
vm.prank(ada); w.giveBack(1);                // Lion: Available, no hirer, timesHired 1
w.retire(2);                                 // costumes(2) is all zeros; costumeIds is [1]
```
