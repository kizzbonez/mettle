Complete `TipPool` in `solution.sol`. The state, events and errors are declared for you, and
`token` may be any ERC-20, including the unusual ones from the lesson.

1. **`addCrew(address member)`**: only the skipper may call it (`NotSkipper(caller)`, already
   written). Revert with `CrewFull()` when the crew already has `MAX_CREW` (12) members, so the
   loop in `tip` stays small for ever.
2. **`tip(uint256 amount)`**:
   - revert with `NoCrew()` when there is no crew;
   - take the tokens with `token.safeTransferFrom(msg.sender, address(this), amount)`
     (`SafeERC20` is already attached to `IERC20`): plain `transferFrom` reverts on a token
     that returns nothing;
   - measure what arrived, `balanceOf(this)` after minus before, because a token may keep a
     fee: share **that** amount, never `amount`;
   - add the old `leftover` to it, give every crew member `toShare / crewSize` more in `owed`,
     and keep the rest (less than one token per member) as the new `leftover`;
   - emit `Tipped(msg.sender, received)`.
3. **`claim()`** pays the caller, and only the caller, what they are owed: revert with
   `NothingOwed()` if it is zero; otherwise set their `owed` to zero, emit
   `Claimed(member, amount)` and send it with `token.safeTransfer`. A member the token has
   frozen can then fail to collect without stopping anyone else.

```solidity
// crew: ann, ben, cat; a passenger has approved the pool
pool.tip(100);   // owed: 33 each; leftover() is 1
pool.tip(50);    // 50 + 1 shared: owed is 50 each; leftover() is 0
pool.claim();    // as ann: emits Claimed(ann, 50); ann holds 50 tokens; ben is still owed 50
pool.claim();    // as ann again: reverts with NothingOwed()
```

The hidden tests freeze a member's address, tip in a token that returns no values, one that
keeps 2% of every transfer and one that returns `false`, add a thirteenth member, and fuzz
tips to check that the shares and leftover always add up to what arrived.
