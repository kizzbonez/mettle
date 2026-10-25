`solution.sol` has three contracts. The tests deploy them and wire the timelock themselves: a
`TimelockController` with a one-day delay in which only the Governor proposes and anyone executes.

1. **`CivicToken`** counts time in seconds. Override
   `function clock() public view override returns (uint48)` to return `uint48(block.timestamp)`
   and `function CLOCK_MODE() public pure override returns (string memory)` to return
   `"mode=timestamp"`. The Governor reads the token's clock, so its durations below are seconds.
2. **`CouncilGovernor`**, with the constructor `constructor(IVotes token, TimelockController timelock)`:
   - `GovernorSettings(2 days, 5 days, 10e18)`: a voting delay of 2 days, a voting period of
     5 days, and a proposal threshold of 10 CIVIC.
   - A quorum of 10% of the supply at the snapshot: delete the starter's `quorum` function and
     inherit `GovernorVotesQuorumFraction(10)`.
   - Execution through the timelock: inherit `GovernorTimelockControl(timelock)`. The compiler
     then lists the functions that two bases define (`state`, `proposalNeedsQueuing`,
     `_queueOperations`, `_executeOperations`, `_cancel`, `_executor`); override each with
     `override(Governor, GovernorTimelockControl)` and return `super`'s result, as in the lesson.
3. **`CommunityFund`**, owned by the timelock, with the clerk as `guardian`:
   - `grant(address to, uint256 amount)`: only `timelock` may call it, otherwise
     `NotTimelock(msg.sender)`; while paused it reverts with `FundPaused()`. It emits
     `Granted(to, amount)` and pays `to` with `call`, reverting with `GrantFailed()` if the
     payment fails.
   - `pause()`: only `guardian`, otherwise `NotGuardian(msg.sender)`. Sets `paused` and emits
     `PauseChanged(true)`.
   - `unpause()`: only `timelock`, otherwise `NotTimelock(msg.sender)`. Clears `paused` and
     emits `PauseChanged(false)`. The guardian can stop the fund but not restart it or spend.

Ada holds 1,500 CIVIC and Ben 600, both delegated to themselves, out of a supply of 10,000:

```solidity
uint256 id = governor.propose(targets, values, calldatas, "Grant 2 ether to repair the bell tower");
// state 0 (Pending); 2 days later: 1 (Active)
governor.castVote(id, 1);                                   // Ada: for
governor.castVote(id, 0);                                   // Ben: against
// 5 days later: 4 (Succeeded): 1,500 for beats 600 against, and is above the quorum of 1,000
governor.queue(targets, values, calldatas, keccak256(bytes(description)));   // 5 (Queued)
// 1 day later
governor.execute(targets, values, calldatas, keccak256(bytes(description))); // 7 (Executed)
// the timelock called fund.grant(bellTower, 2 ether), which emitted Granted
```
