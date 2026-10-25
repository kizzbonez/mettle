---
title: Thinking Like an Attacker
summary: See why contracts are attacked differently from other software, threat-model one by its assets, actors, trust boundaries and invariants, learn from the incidents and the OWASP list that shape the field, and prove a flaw with a Foundry attack test before you fix it.
minutes: 35
objectives:
  - Threat-model a contract by listing its assets, actors, trust boundaries and invariants
  - Explain what The DAO, the Parity multisig wallets and the Bybit theft teach a contract author
  - Apply checks-effects-interactions and least privilege to a function that moves ether
  - Write a Foundry attack test that fails while a flaw exists and guards the fix afterwards
---

## Outline

1. Why contract security is different
2. Threat modelling a contract
3. The attacker's questions
4. Writing an attack test
5. Checks-effects-interactions and least privilege
6. Three incidents
7. The OWASP Smart Contract Top 10

## Why contract security is different

Until now you wrote contracts for people who use them as intended. From here on, assume someone
reads every line looking for a way to take the money:

- **The code is public.** Every contract's bytecode is on chain and most source is published, so
  an attacker can rehearse against a local copy of the chain for free.
- **Anyone can call anything.** Any account or contract can call every `external` and `public`
  function, with any arguments, in any order, as often as gas allows.
- **Transactions are final.** No chargeback, no undo, and no patch unless the contract was built
  to be upgraded (lesson 08).
- **Contracts are composable.** Every external call hands control to code you did not write,
  which can call you back (Medium 01).

## Threat modelling a contract

A **threat model** is a short written answer to "what can go wrong, and who would make it go
wrong?". Write it before the tests, in four parts: the **assets** an attacker wants (ether,
tokens, powers such as minting); the **actors** (users, admins and *anyone*, contracts
included); the **trust boundaries**, every place your code accepts something it does not control
(arguments, `msg.value`, external calls and what they return); and the **invariants**, properties
that must hold after every transaction whatever the actors do.

A club fund lets members deposit, move credit to each other and withdraw:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ClubFund {
    mapping(address => uint256) public creditOf;

    error InsufficientCredit(uint256 available, uint256 needed);
    error PaymentFailed();

    function deposit() external payable {
        creditOf[msg.sender] += msg.value;
    }

    function move(address to, uint256 amount) external {
        uint256 fromCredit = creditOf[msg.sender];
        uint256 toCredit = creditOf[to];
        if (amount > fromCredit) revert InsufficientCredit(fromCredit, amount);
        creditOf[msg.sender] = fromCredit - amount;
        creditOf[to] = toCredit + amount;
    }

    function withdraw(uint256 amount) external {
        uint256 credit = creditOf[msg.sender];
        if (amount > credit) revert InsufficientCredit(credit, amount);
        creditOf[msg.sender] = credit - amount;
        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert PaymentFailed();
    }
}
```

The asset is the ether; the actors are members and anyone else; the boundaries are `to`,
`amount` and the `call` in `withdraw`. The invariant: **all members' credit together never
exceeds the ether the fund holds**, so nobody can withdraw what was not deposited for them.

## The attacker's questions

Then ask of every function:

1. Who can call this, and should they?
2. What if I call it twice, in a loop, or again from inside the external call it makes?
3. What if two arguments are equal, or zero, or the maximum, or a list holds a repeat?
4. What if I call functions in an unexpected order, or at an unexpected time?
5. What if the caller or the recipient is a contract?

Question 3 breaks `move`. If `to` is the caller, both credits are read before either write, so
the second write restores the old credit plus `amount`: moving credit to yourself creates it.

## Writing an attack test

An **attack test** (in an audit, a **proof of concept**) turns a suspected flaw into a test.
Write it as the invariant, not as the theft: an honest user, then an attacker taking steps anyone
may take, then assertions that the invariant survived. It fails while the bug exists, which
proves it, and passes once fixed, guarding against its return.

```solidity
contract ClubFundAttackTest is Test {
    ClubFund fund;
    address alice = makeAddr("alice");
    address mallory = makeAddr("mallory");

    function setUp() public {
        fund = new ClubFund();
        vm.deal(alice, 5 ether);
        vm.deal(mallory, 1 ether);
        vm.prank(alice);
        fund.deposit{value: 5 ether}();
    }

    function test_moving_credit_to_yourself_creates_nothing() public {
        vm.startPrank(mallory);
        fund.deposit{value: 1 ether}();
        fund.move(mallory, 1 ether);
        fund.withdraw(fund.creditOf(mallory));
        vm.stopPrank();

        assertLe(mallory.balance, 1 ether, "mallory's ether after the attack");
        assertEq(address(fund).balance, 5 ether, "the fund still holds alice's deposit");
    }
}
```

```text
[FAIL: mallory's ether after the attack: 2000000000000000000 > 1000000000000000000] test_moving_credit_to_yourself_creates_nothing() (gas: 137281)
```

Mallory paid in 1 ether and left with 2, one of them Alice's. `forge test -vvvv` prints every
call: here `creditOf(mallory)` returns `2000000000000000000 [2e18]` just before the withdrawal.

The fix writes the sender's credit before it reads the recipient's, so `to == msg.sender` is
handled correctly:

```solidity
        creditOf[msg.sender] = fromCredit - amount;
        creditOf[to] += amount; // read after the write above
```

```text
[PASS] test_moving_credit_to_yourself_creates_nothing() (gas: 131070)
```

## Checks-effects-interactions and least privilege

`withdraw` follows **checks-effects-interactions** (CEI), the order the Solidity documentation
recommends: the **checks** (caller, arguments, balances), then the **effects** (state changes),
and the **interactions** (external calls, payments) last. A payment runs the recipient's code,
which may call you again; your state must already say the money is gone. Paying first is how The
DAO was emptied (lesson 02).

**Least privilege** gives each actor only the power its job needs, so a stolen admin key costs
little. This fund's treasurer may take the joining fees and nothing else:

```solidity
    function collectFees(address to) external {
        if (msg.sender != treasurer) revert NotTreasurer(msg.sender); // check
        uint256 amount = fees;
        fees = 0; // effect
        (bool ok,) = to.call{value: amount}(""); // interaction, last
        if (!ok) revert PaymentFailed();
    }
```

```text
[PASS] test_strangers_cannot_collect() (gas: 33786)
[PASS] test_treasurer_takes_only_the_fees() (gas: 40774)
```

## Three incidents

- **The DAO, June 2016.** A fund that sent ether before updating balances; an attacker re-entered
  it again and again and drained over 3.6 million ETH. On 20 July 2016 Ethereum hard-forked to
  move the funds to a withdraw-only contract; the chain that refused became Ethereum Classic.
- **Parity multisig wallets, 2017.** Wallets forwarded unknown calls with `delegatecall` (lesson
  08) to a shared library. In July, anyone could reach its `initWallet` through a wallet: an
  attacker made himself owner of three wallets and took 153,037 ETH. In November, a user called
  `initWallet` on the replacement library itself, never initialised, then its `kill`, which ran
  `selfdestruct`: 587 wallets lost their code and 513,774 ETH froze for good.
- **Bybit, February 2025.** About 400,000 ETH left an exchange's Safe multisig. The contracts
  worked as written: attackers had planted JavaScript in the wallet's web interface, so the
  signers approved a transaction that made the Safe `delegatecall` the attacker's contract and
  replace its implementation. The people and software that sign are inside your threat model.

## The OWASP Smart Contract Top 10

The **OWASP Smart Contract Top 10** ranks the weaknesses behind real losses. The current edition,
2026, built from 2025's incidents: SC01 Access Control Vulnerabilities (lesson 03), SC02 Business
Logic Vulnerabilities (any broken invariant), SC03 Price Oracle Manipulation and SC04 Flash
Loan–Facilitated Attacks (lesson 06), SC05 Lack of Input Validation, SC06 Unchecked External
Calls (lessons 02 and 09), SC07 Arithmetic Errors (Rounding & Precision) and SC09 Integer Overflow
and Underflow (lesson 04), SC08 Reentrancy Attacks (lesson 02) and SC10 Proxy & Upgradeability
Vulnerabilities (lesson 08). Rankings change between editions, so cite the year. Older write-ups use **SWC** numbers, such as SWC-107 for reentrancy, from a
registry unmaintained since 2020.

## Common mistakes

- **Asserting the theft.** `assertEq(mallory.balance, 2 ether)` passes on the bug and fails once
  you fix it, while happy-path tests pass either way. Assert the invariant.
- **A step that reverts after the fix.** With the fix, `fund.move(mallory, 2 ether)` reverts with
  `InsufficientCredit(1000000000000000000 [1e18], 2000000000000000000 [2e18])` and the attack test
  fails for the wrong reason. Use legal steps, or `try fund.move(...) {} catch {}`.
- **An all-powerful admin.** After an owner's `sweep()` sends the whole balance away, Alice's
  `withdraw(1 ether)` reverts with `PaymentFailed()`. Limit each power to what the role needs.
- **Assuming callers are people.** `if (msg.sender != tx.origin) revert NoContracts();` locks out
  smart-wallet users, and since 2025 ordinary accounts can run code too (Professional 06).

## Practice

1. Threat-model this jar: its asset, actors, trust boundaries and an invariant. Which of the five
   questions does `withdrawTips` fail?
2. Write an attack test that proves it, and see it fail.
3. Fix `withdrawTips` so that your test passes.

```solidity
contract TipJar {
    address public immutable owner = msg.sender;

    error PaymentFailed();

    receive() external payable {}

    function withdrawTips(address to) external {
        (bool ok,) = to.call{value: address(this).balance}("");
        if (!ok) revert PaymentFailed();
    }
}
```

### Answers

1. Asset: the tips. Actors: the owner, customers, anyone. Boundaries: `to` and the `call`.
   Invariant: only the owner takes tips out. Question 1 fails: anyone can.
2. The attack test, with 3 ether of tips in the jar:

```solidity
    function test_only_the_owner_can_take_the_tips() public {
        address mallory = makeAddr("mallory");
        vm.prank(mallory);
        try jar.withdrawTips(mallory) {} catch {}
        assertEq(mallory.balance, 0, "ether a stranger took from the jar");
        assertEq(address(jar).balance, 3 ether, "tips left in the jar");
    }
```

```text
[FAIL: ether a stranger took from the jar: 3000000000000000000 != 0] test_only_the_owner_can_take_the_tips() (gas: 40745)
```

3. Add `error NotOwner(address caller);` and make the check the first line of `withdrawTips`:
   `if (msg.sender != owner) revert NotOwner(msg.sender);`

```text
[PASS] test_only_the_owner_can_take_the_tips() (gas: 33371)
```

## Key takeaways

- Public code, open entry points, final transactions and callbacks make every function a target.
- Name assets, actors, trust boundaries and invariants, then ask the five questions of every
  function: who, twice, odd inputs, odd order, contracts.
- An attack test asserts the invariant: red while the bug lives, green and guarding once fixed.
- Checks, then effects, then interactions; and give every role the least power it needs.

## Further reading

- [Solidity documentation: Security Considerations](https://docs.soliditylang.org/en/latest/security-considerations.html)
- [OWASP Smart Contract Top 10: 2026](https://scs.owasp.org/sctop10)
- [ethereum.org: The history of Ethereum's forks (the DAO fork)](https://ethereum.org/en/ethereum-forks/)
- [Foundry: Testing](https://getfoundry.sh/forge/tests/overview)
