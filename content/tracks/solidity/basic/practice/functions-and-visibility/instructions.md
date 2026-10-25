`solution.sol` holds the hut's `HutBunks` contract. The constructor records the deployer as the
`warden` and sets the immutable `bunks`; `taken` and `lastLeader` are ordinary state variables
with public getters, and `freeBunks()` is a finished `public view` function. You write one
function body.

1. Press **Run** once. The visible test fails with `` `checkIn` is not written yet ``.
2. At the comment `YOUR CODE`, write the body of
   **`function checkIn(uint256 party) external returns (uint256 first, uint256 left)`**. The
   caller is the party's leader, checking in `party` guests (always at least 1, and always
   fewer than the free bunks in this lab):
   - `first` is the number of the party's first bunk. Bunks are handed out in order from bunk 1,
     so it is one more than the bunks already taken.
   - Add `party` to `taken`.
   - Record the caller in `lastLeader`. The caller is `msg.sender`, not the warden and not
     `tx.origin`, which in a test stays the default sender whatever `vm.prank` says.
   - `left` is the bunks still free once the party is in: call `freeBunks()` internally, after
     updating `taken`, rather than repeating its arithmetic.

   `first` and `left` are **named returns**: assign them, and they are returned when the function
   ends, with no `return` statement. Delete the `revert` line.
3. Press **Run**. The visible test deploys the hut as the warden and checks in two parties, each
   from its leader's account with `vm.prank`. It prints each party's bunks with `console.log`.
4. When it passes, press **Submit**. The hidden tests check the leader for many random accounts,
   the bunk numbers of several parties and a full hut, and that `left` always agrees with
   `freeBunks()`, `taken` and `bunks`.

The two parties of the visible test, in a hut of 12 bunks:

```solidity
vm.prank(keeper);
HutBunks hut = new HutBunks(12);  // hut.warden() is keeper
vm.prank(ada);
hut.checkIn(3);                   // returns (1, 9): bunks 1 to 3, 9 left
vm.prank(bo);
hut.checkIn(2);                   // returns (4, 7): bunks 4 and 5, 7 left
hut.lastLeader();                 // bo
hut.taken();                      // 5
```

A party bigger than the free bunks would make `freeBunks()` underflow and the call revert with
panic 0x11. Lesson 05 replaces that with an error of the hut's own, which says what went wrong.
