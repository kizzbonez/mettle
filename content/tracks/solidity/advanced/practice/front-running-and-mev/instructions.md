`solution.sol` holds `TreasureHunt`, a commit-reveal prize claim. A finder first commits
`keccak256(abi.encode(phrase, salt, msg.sender))`, then later reveals `(phrase, salt)` to win the
pot. The commitment already binds `msg.sender`, so only its author can open it. One protection is
missing: nothing stops a reveal in the **same block** as its commit. A searcher who reads a
pending reveal learns the phrase, then commits and reveals it in one bundle ahead of the finder.

**Task**

In **`reveal`**, after loading the caller's commitment and before checking the phrase, require
that at least `REVEAL_DELAY` blocks have passed since the commit:

```solidity
uint256 allowedFrom = committedAt[commitment] + REVEAL_DELAY;
if (block.number < allowedFrom) revert RevealTooEarly(block.number, allowedFrom);
```

With `REVEAL_DELAY == 1`, a reveal must land in a later block than its commit. A searcher who
only learns the phrase at reveal time cannot both commit and reveal in the same block, so the
finder who committed earlier keeps the lead. Keep everything else: the `AlreadyWon`,
`NoCommitment` and `WrongPhrase` checks, the `Won` event, and paying the whole balance to the
winner.

**Example**

```solidity
bytes32 c = keccak256(abi.encode(phrase, salt, msg.sender));
hunt.commit(c);                 // block N
// ... a later block ...
hunt.reveal(phrase, salt);      // block N+1 or later: wins the pot
hunt.reveal(phrase, salt);      // in block N: reverts RevealTooEarly(N, N+1)
```

The hidden tests have a searcher commit and reveal in one block (which must fail), try to open a
commitment they never made (`NoCommitment`), and check that an honest finder who committed first
still wins a block later and that the hunt is won only once.
