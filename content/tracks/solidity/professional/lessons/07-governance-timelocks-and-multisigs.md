---
title: Governance, Timelocks and Multisigs
summary: Decide who controls a protocol and how fast, using multisig wallets, OpenZeppelin's TimelockController, and on-chain governance with Governor and ERC20Votes; follow a proposal from creation to execution, keep a guardian for emergencies, and see why vote snapshots stop flash-loaned votes.
minutes: 40
objectives:
  - Explain what multisigs, timelocks and token governance each protect against, and set a TimelockController's roles safely
  - Build an ERC20Votes token and a Governor with a timelock, and explain delegation, snapshots, quorum and the clock
  - Take a proposal through propose, castVote, queue and execute in a Foundry test
  - Explain how flash-loaned votes work and why voting at a past snapshot stops them
---

## Outline

1. Who controls a protocol
2. Multisig wallets
3. Timelocks
4. Votes tokens and the Governor
5. The proposal lifecycle
6. Guardians, and governance attacks

## Who controls a protocol

Every owner, role or upgrade function (lesson 03) is power over other people's money. If one EOA
holds it, one stolen key or one dishonest insider can take everything. For each privileged function,
ask three questions: who can call it, how fast, and who can stop them. Production protocols answer
with three layers: a multisig instead of a single key, a timelock so that changes are announced
before they happen, and often token-holder governance.

## Multisig wallets

A **multisig** is a smart account that runs a transaction only when M of its N owners approve it.
Safe is the standard: owners sign off-chain, anyone submits the signatures, and the contract checks
the **threshold**, for example 3 of 5. Owners should be different people on separate hardware
wallets. Make the multisig the owner of admin roles from deployment (lesson 09), never the
deployer's key.

A multisig protects keys, not judgement. In February 2025 Bybit's signers approved what their
compromised wallet interface showed as a routine transfer; the transaction was really a
`delegatecall` that replaced their Safe's implementation, and over 1.4 billion dollars of assets
left. Signers must check the raw calldata on their hardware wallet's screen.

## Timelocks

A **timelock** holds the protocol's powers and runs an action only some time after it was announced,
so users can review it and leave first. OpenZeppelin's `TimelockController(minDelay, proposers,
executors, admin)` has roles: proposers `schedule` operations, executors `execute` them once
`minDelay` has passed, cancellers `cancel` them. Proposers get the canceller role too, and granting
`EXECUTOR_ROLE` to `address(0)` lets anyone execute. The delay changes only through an operation the
timelock runs on itself.

The timelock, not a person, owns the protocol's contracts. Give its admin role to nobody but itself:
a leftover admin or extra proposer can bypass every vote.

## Votes tokens and the Governor

On-chain **governance** lets token holders vote on proposals. OpenZeppelin's `ERC20Votes` records
**checkpoints** of each account's voting power over time, and power counts only after the holder
**delegates** it, to someone else or to themselves:

```solidity
contract ClubToken is ERC20, ERC20Permit, ERC20Votes {
    constructor(address holder) ERC20("Club", "CLUB") ERC20Permit("Club") {
        _mint(holder, 1_000e18);
    }

    function clock() public view override returns (uint48) {
        return uint48(block.timestamp);
    }

    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=timestamp";
    }

    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }

    function nonces(address owner) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}
```

```text
  balance: 1000000000000000000000
  votes before delegating: 0
  votes after delegating: 1000000000000000000000
```

`clock()` and `CLOCK_MODE()` make the token count time in seconds (the default is block numbers);
the Governor reads the token's clock, so its durations use the same unit. The Governor is assembled
from modules:

```solidity
contract ClubGovernor is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    constructor(IVotes token, TimelockController timelock)
        Governor("ClubGovernor")
        GovernorSettings(1 days, 1 weeks, 0) // voting delay, voting period, proposal threshold
        GovernorVotes(token)
        GovernorVotesQuorumFraction(4) // 4% of the supply at the snapshot
        GovernorTimelockControl(timelock)
    {}

    // Plus one override for each function two bases define (votingDelay, votingPeriod,
    // proposalThreshold, state, proposalNeedsQueuing, _queueOperations, _executeOperations,
    // _cancel, _executor), each returning super's result. The compiler lists them.
}
```

**Voting delay** is the wait between proposing and voting, **voting period** how long voting lasts,
**proposal threshold** the votes needed to propose. **Quorum** is the minimum of for and abstain
votes. `GovernorCountingSimple` counts against (0), for (1) and abstain (2).

## The proposal lifecycle

The test wires the timelock (2-day delay) so that only the Governor proposes and cancels and anyone
executes, renounces its own admin role, and gives the treasury to the timelock. Then Alice
delegates, proposes `Treasury.pay(builder, 1 ether)`, votes and executes:

```solidity
vm.prank(alice);
uint256 id = governor.propose(targets, values, calldatas, description);
vm.warp(block.timestamp + 1 days + 1); // past the voting delay
vm.prank(alice);
governor.castVote(id, 1);
vm.warp(block.timestamp + 1 weeks); // past the voting period
bytes32 descriptionHash = keccak256(bytes(description));
governor.queue(targets, values, calldatas, descriptionHash);
vm.warp(block.timestamp + 2 days); // past the timelock delay
governor.execute(targets, values, calldatas, descriptionHash);
```

Logging `governor.state(id)` after each step:

```text
  after propose: 0
  after the voting delay: 1
  after the voting period: 4
  after queue: 5
  after execute: 7
  builder balance: 1000000000000000000
```

The states are Pending (0), Active (1), Succeeded (4), Queued (5) and Executed (7); the others are
Canceled, Defeated and Expired. The proposal id is a hash of the targets, values, calldatas and
description hash, so `queue` and `execute` repeat them exactly. Executing without the timelock wait
fails:

```text
[FAIL: TimelockUnexpectedOperationState(0x7084b7ac0989d8f8b8b3dd56807227838fb6928828b4403a652adb9d5b361006, 0x0000000000000000000000000000000000000000000000000000000000000004)] test_early_execute() (gas: 534720)
```

The second value is a bitmap of the states the operation needed: `Ready`.

## Guardians, and governance attacks

The delays that protect users also slow down fixes. Keep a **guardian**, usually a multisig, with
powers that can only stop things: pause a contract, or cancel a malicious proposal
(`GovernorProposalGuardian`, or the timelock's canceller role). Unpausing, paying and upgrading stay
with the timelock: quick to stop, slow to restart.

In April 2022 an attacker flash-borrowed about a billion dollars of assets, deposited them in
Beanstalk for voting power counted at the current moment, passed an emergency proposal that sent
them about 182 million dollars of the protocol's assets, and repaid the loan in the same
transaction. `GovernorVotes` prevents this: a vote weighs `getPastVotes(voter, snapshot)`, where the
**snapshot** is the proposal's creation time plus the voting delay, already past when voting opens.
Mallory receives 900 tokens during the voting period, delegates and votes:

```text
  mallory's balance: 900000000000000000000
  mallory's vote weight: 0
  quorum: 40000000000000000000
```

Votes bought before the snapshot still count, which is why quorum, the voting delay and the
timelock's exit window matter.

## Common mistakes

- **Not delegating.** Votes stay 0, so the holder's votes weigh nothing, and with a proposal
  threshold above zero their `propose` fails with `GovernorInsufficientProposerVotes`. Delegate,
  even to yourself.
- **Mixing clocks.** A timestamp token with block-number settings (`7200` for a day) gives a
  two-hour voting delay. Use `1 days` with `mode=timestamp`.
- **Funds or ownership at the Governor.** With `GovernorTimelockControl` the timelock executes, so a
  treasury owned by the Governor rejects it with `OwnableUnauthorizedAccount(timelock)`.
- **A deployer left as admin or proposer.** Renounce `DEFAULT_ADMIN_ROLE` after setup; extra
  proposers can run anything as the timelock.

## Practice

1. Supply 1,000 tokens, quorum 4%: Bob votes for with 30 and Carol against with 10. What state does
   the proposal end in?
2. What does `token.getPastVotes(bob, block.timestamp)` do?
3. Write the timelock setup: only the Governor proposes, anyone executes, no admin.

### Answers

```solidity
// 3. The Governor needs the timelock's address and the timelock the Governor's, so predict
// the Governor's CREATE address (lesson 09). Proposers become cancellers; address(0) executes.
address predicted = vm.computeCreateAddress(address(this), vm.getNonce(address(this)) + 1);
address[] memory proposers = new address[](1);
proposers[0] = predicted;
address[] memory executors = new address[](1);
executors[0] = address(0);
TimelockController tl = new TimelockController(2 days, proposers, executors, address(0));
ClubGovernor gov = new ClubGovernor(token, tl);
```

The vote of exercise 1, `getPastVotes` with the current time, then the roles of exercise 3:

```text
  state: 3
  quorum: 40000000000000000000
[FAIL: ERC5805FutureLookup(1, 1)] test_future_lookup() (gas: 8551)
  governor at predicted address: true
  governor proposes: true
  governor cancels: true
  anyone executes: true
  this test is admin: false
```

1. Defeated (3): 30 for votes are below the quorum of 40, although for beats against.
2. It reverts with `ERC5805FutureLookup`: the current moment is not final yet, so only past
   timepoints can be read.
3. Alternatively the deployer keeps admin for setup, grants the roles and renounces admin, as the
   lesson's test did.

## Key takeaways

- Multisig for keys, timelock for warning, governance for legitimacy, a guardian that can only stop.
- The timelock owns the contracts and funds; only the Governor proposes; nobody keeps admin.
- Votes count after delegation, at the proposal snapshot, so flash-loaned tokens weigh nothing.
- Proposals go Pending, Active, Succeeded, Queued, Executed; queue and execute repeat the same data.

## Further reading

- [OpenZeppelin Contracts: How to set up on-chain governance](https://docs.openzeppelin.com/contracts/5.x/governance)
- [OpenZeppelin Contracts: Governance API](https://docs.openzeppelin.com/contracts/5.x/api/governance)
- [Safe documentation: Smart account overview](https://docs.safe.global/advanced/smart-account-overview)
- [Immunefi: Hack Analysis: Beanstalk Governance Attack, April 2022](https://immunefi.com/blog/bug-fix-reviews/hack-analysis-beanstalk-governance-attack-april-2022/)
