---
title: Invariant Testing and Security Tools
summary: State the properties your contract must never break and let Foundry hunt for a sequence of calls that breaks them, with handlers, actors and ghost variables; then add forge lint, other static analysers and formal tools, and finish with an audit checklist.
minutes: 40
objectives:
  - Write invariants as properties of a contract's state, and explain how they differ from unit and fuzz tests
  - Build a Foundry invariant test with a handler, bounded inputs, actors and ghost variables, and read its failing call sequence
  - Configure runs and depth, inline and in foundry.toml, and choose them sensibly
  - Run forge lint, and say what Slither, Aderyn, Halmos and Certora add and what each cannot find
---

## Outline

1. Properties and invariants
2. An invariant test with a handler
3. Reading a broken invariant
4. Runs, depth and fuzzing strategy
5. Static analysis and formal methods
6. An audit checklist

## Properties and invariants

A **property** is a statement about your contract that should be true. An **invariant** is a
property that must hold *after every possible sequence of calls*: "the ether the bank holds
equals the sum of its balances", "total supply equals the sum of all balances", "a withdrawal
never lowers the value of a share". Most exploits in this level broke an invariant the authors
never wrote down. A unit test checks one story you thought of; a fuzz test (Basic 12) checks one
call with random inputs; an **invariant test** lets the fuzzer write the stories, calling your
functions in random orders with random arguments, and checks the invariants after each call.

## An invariant test with a handler

In Foundry, a function named `invariant_...` is an invariant. During a **run**, forge makes a
sequence of random calls (the **depth**) to the **target contracts**, checking every invariant
after each call; by default the targets are all contracts deployed in `setUp`. Calling the bank
directly with random senders and amounts would mostly revert, so you target a **handler**
instead: a contract that calls the bank the way users would, with **actors** (a few fixed
users), inputs bounded to what they can afford, and **ghost variables**, totals the bank itself
does not keep.

```solidity
function transfer(address to, uint256 amount) external { // in Bank
    uint256 toBalance = balanceOf[to];
    balanceOf[msg.sender] -= amount;
    balanceOf[to] = toBalance + amount;
}

contract BankHandler is Test {
    Bank public immutable bank;
    address[3] public actors = [address(0xA1), address(0xA2), address(0xA3)];
    uint256 public ghostDeposited; // ether ever deposited
    uint256 public ghostWithdrawn; // ether ever withdrawn

    constructor(Bank bank_) {
        bank = bank_;
    }

    function deposit(uint256 actorSeed, uint256 amount) external {
        address actor = actors[actorSeed % 3];
        amount = bound(amount, 0, 10 ether);
        vm.deal(actor, amount);
        vm.prank(actor);
        bank.deposit{value: amount}();
        ghostDeposited += amount;
    }

    function transfer(uint256 fromSeed, uint256 toSeed, uint256 amount) external {
        address from = actors[fromSeed % 3];
        amount = bound(amount, 0, bank.balanceOf(from));
        vm.prank(from);
        bank.transfer(actors[toSeed % 3], amount);
    }
    // withdraw(actorSeed, amount) is like deposit, bounded by the balance
    // sumOfBalances() adds up the three actors' balances
}

contract BankInvariantTest is Test {
    function setUp() public {
        bank = new Bank();
        handler = new BankHandler(bank);
        targetContract(address(handler)); // the fuzzer calls only the handler's functions
    }

    function invariant_every_balance_is_backed() public view {
        assertEq(handler.sumOfBalances(), address(bank).balance, "the balances against the ether held");
    }

    function invariant_ether_matches_the_ghosts() public view {
        assertEq(
            address(bank).balance, handler.ghostDeposited() - handler.ghostWithdrawn(), "the ether against the ghosts"
        );
    }
}
```

The handler deliberately lets `from` and `to` be the same actor. Excluding cases "nobody would
do" is how handlers hide bugs.

## Reading a broken invariant

```text
[FAIL: the balances against the ether held: 642843114610379775 != 642843114610378447] invariant_every_balance_is_backed
	[Sequence] (original: 21, shrunk: 2)
		sender=0x0000000000000000000000000000000000000040 addr=[test/Example.t.sol:BankHandler]0x2e234DAe75C793f67A35089C9d99245E1C58470b calldata=deposit(uint256,uint256) args=[3, 2224]
		sender=0x00000000000000000000000000000000000000A2 addr=[test/Example.t.sol:BankHandler]0x2e234DAe75C793f67A35089C9d99245E1C58470b calldata=transfer(uint256,uint256,uint256) args=[937225833943612753300732349268627383237668587 [9.372e44], 23348026406849117884212901645849367278604865861741439116528 [2.334e58], 115792089237316195423570985008687907853269984665640564039457584007913129639933 [1.157e77]]

BankInvariantTest invariants: 1/2 invariants broken
[PASS] invariant_ether_matches_the_ghosts
[FAIL: the balances against the ether held: 642843114610379775 != 642843114610378447] invariant_every_balance_is_backed
 BankInvariantTest invariants (runs: 64, calls: 2048, reverts: 3)
```

The first line is the broken invariant and its values. Forge **shrinks** the failing sequence,
here from 21 calls to 2: a deposit by actor `3 % 3`, then a transfer whose two seeds are
equal modulo 3, a transfer to yourself. `toBalance` was read before the debit, so writing
`toBalance + amount` gives the amount back: money from nothing. The ghost invariant still
passes, because the ether did not change; only the balances did. Replay a sequence with
`-vvvv` to see every call's trace.

## Runs, depth and fuzzing strategy

A run of depth 32 checks 32-call stories; more runs explore more stories, more depth reaches
states that take many steps (a pool after many deposits). The lab harness uses 64 runs and depth
32; Foundry's own defaults are 256 runs and depth 500. Change them for one invariant with
inline config:

```solidity
/// forge-config: default.invariant.runs = 200
/// forge-config: default.invariant.depth = 50
function invariant_every_balance_is_backed() public view {
```

After the fix (`balanceOf[to] += amount` after the debit):

```text
[PASS] invariant_every_balance_is_backed() (runs: 200, calls: 10000, reverts: 0)

╭-------------+----------+-------+---------+----------╮
| Contract    | Selector | Calls | Reverts | Discards |
+=====================================================+
| BankHandler | deposit  | 3398  | 0       | 0        |
|-------------+----------+-------+---------+----------|
| BankHandler | transfer | 3321  | 0       | 0        |
|-------------+----------+-------+---------+----------|
| BankHandler | withdraw | 3281  | 0       | 0        |
╰-------------+----------+-------+---------+----------╯
```

The table shows each handler function was really exercised; a column of reverts means your
bounds are wrong and calls are wasted. Prefer `bound` to `vm.assume` (each rejected input is a
discarded call), keep a few actors so balances collide, and use `[invariant]` keys such as
`runs`, `depth` and `fail_on_revert` in `foundry.toml` for the whole project.

## Static analysis and formal methods

**Static analysis** reads code without running it and flags known bad patterns. Foundry has one
built in, `forge lint` (part of `forge build` unless switched off):

```text
warning[tx-origin]: `tx.origin` is used for authorization
   ╭▸ src/Example.sol:11:17
   │
11 │         require(tx.origin == owner, "not owner");
   │                 ━━━━━━━━━━━━━━━━━━
   │
   ╰ help: https://getfoundry.sh/forge/linting/tx-origin

warning[divide-before-multiply]: division before multiplication may lose precision
   ╭▸ src/Example.sol:16:16
   │
16 │         return salary / 100 * percent;
   │                ━━━━━━━━━━━━━━━━━━━━━━
   │
   ╰ help: https://getfoundry.sh/forge/linting/divide-before-multiply
```

On that small payroll contract it also reported `unchecked-call`, `erc20-unchecked-transfer`,
`arbitrary-send-eth` and `missing-zero-check`. **Slither** (Trail of Bits) and **Aderyn**
(Cyfrin) are standalone analysers with many more detectors, such as reentrancy paths and
unprotected functions. Analysers are fast and noisy: each finding needs a human verdict, and they
cannot know your business rules, so they would not have found the self-transfer bug.

**Formal methods** prove a property for *all* inputs instead of sampling them. **Halmos** runs
Foundry-style `check_...` tests symbolically; the **Certora Prover** checks rules written in its
own language, CVL. They give the strongest guarantees for small, critical pieces of code, at the
price of time and expertise.

## An audit checklist

Before anyone else's money goes in, walk through: every state-changing function's access check;
checks-effects-interactions and reentrancy guards; every external call's result; price sources
and their staleness; signature domains, nonces and deadlines; rounding direction; loop bounds
and push payments; the tokens you accept; proxy storage and initializers; events for every
change; and the invariants, written down and tested. Professional 08 turns this into an audit.

## Common mistakes

- **No `targetContract`.** The fuzzer also calls `Bank` directly. On the *fixed* bank, actor
  `0xA2` sent 161 wei to an address the handler does not count:
  `[FAIL: the balances against the ether held: 5803 != 5964]`. Target the handler.
- **A handler that reverts.** Unbounded amounts fill the table with reverts; `bound` every input.
- **Over-constrained handlers.** `vm.assume(from != to)` would have hidden the self-transfer bug.
- **Ghosts copied from the contract.** A ghost that reads `bank.total()` can never disagree with
  it. Update ghosts from what the handler did.
- **Treating tools as proof.** A clean `forge lint` report found no business-logic bug here.

## Practice

1. Fix `Bank.transfer` so that both invariants hold.
2. In the handler, why must `withdraw` bound `amount` by `bank.balanceOf(actor)`?
3. Which tool would most likely catch each: a `tx.origin` check, the self-transfer bug, and
   "`mulDiv` never overflows for any input below 2^128"?

### Answers

```solidity
function transfer(address to, uint256 amount) external {
    balanceOf[msg.sender] -= amount;
    balanceOf[to] += amount; // read after the debit: a transfer to yourself changes nothing
}
```

The same run as the 200-run result above, for the other invariant at the harness's settings:

```text
[PASS] invariant_ether_matches_the_ghosts() (runs: 64, calls: 2048, reverts: 0)

╭-------------+----------+-------+---------+----------╮
| Contract    | Selector | Calls | Reverts | Discards |
+=====================================================+
| BankHandler | deposit  | 724   | 0       | 0        |
|-------------+----------+-------+---------+----------|
| BankHandler | transfer | 669   | 0       | 0        |
|-------------+----------+-------+---------+----------|
| BankHandler | withdraw | 655   | 0       | 0        |
╰-------------+----------+-------+---------+----------╯
```

2: without the bound almost every withdrawal reverts with an underflow, so the sequences never
reach interesting states. 3: `forge lint` (`tx-origin`), an invariant test, and a formal tool
such as Halmos, which proves it for every input where a fuzzer only samples.

## Key takeaways

- Write invariants down; test them after every call of random sequences, not one story at a time.
- Target a handler with actors, bounded inputs and ghost variables updated from its own actions.
- Read the shrunk sequence first: it is usually the shortest path to the bug.
- Check the call table: reverts and discards mean wasted runs.
- Linters and analysers find patterns, formal tools prove properties; neither replaces invariants
  and review.

## Further reading

- [Foundry: Invariant testing](https://www.getfoundry.sh/guides/invariant-testing)
- [Foundry: Linting with forge lint](https://www.getfoundry.sh/forge/linting)
- [Slither, the Solidity static analyzer](https://github.com/crytic/slither)
- [Halmos: symbolic testing for EVM smart contracts](https://github.com/a16z/halmos)
