Complete `HiveRoll` in `solution.sol`. The constants, the `hives` array, `hiveCount` and the
errors are written for you: keep their names.

1. **`function addHive(string memory name) external`** appends `name` to `hives`. Check in this
   order and revert with the first that applies:
   - `EmptyName()` when the name has no bytes;
   - `NameTooLong(length, MAX_NAME_BYTES)` when it has more than 16 **bytes** (`length` is
     `bytes(name).length`; "Clover" is 6 bytes, `unicode"Königin"` is 8);
   - `RollFull(MAX_HIVES)` when the roll already has 50 hives;
   - `DuplicateName(name)` when a hive already has exactly that name. Compare with `keccak256`;
     case counts, so "clover" is not a duplicate of "Clover".
2. **`function removeHive(uint256 index) external`** removes the hive at `index` with
   swap-and-pop: the last hive moves into its place and the array gets one shorter. Revert with
   `NoSuchHive(index, hives.length)` when there is no hive at `index`, including when the roll is
   empty. A removed name may be added again.
3. **`function hivesStartingWith(bytes1 letter) external view returns (string[] memory found)`**
   returns every name whose first byte is `letter`, in the order of `hives`, and an empty array
   when none does. The comparison is exact: `"H"` does not match `"heather"`.
4. **`function plaque(uint256 index, string memory keeper) external view returns (string memory)`**
   returns the hive's name, then `" - kept by "`, then `keeper`. Revert with
   `NoSuchHive(index, hives.length)` when there is no hive at `index`.

```solidity
HiveRoll roll = new HiveRoll();
roll.addHive("Clover");
roll.addHive("Heather");
roll.addHive("Lime");            // hives: Clover, Heather, Lime
roll.addHive("Clover");          // reverts with DuplicateName("Clover")
roll.removeHive(0);              // hives: Lime, Heather
roll.hivesStartingWith("H");     // ["Heather"]
roll.plaque(1, "Ada");           // "Heather - kept by Ada"
roll.removeHive(2);              // reverts with NoSuchHive(2, 2)
```
