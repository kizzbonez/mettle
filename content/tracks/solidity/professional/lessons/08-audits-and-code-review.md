---
title: Audits and Code Review
summary: Learn how a smart contract audit works, rate findings by impact and likelihood, write a finding with a Foundry proof of concept and a recommendation, review code against a checklist, run forge lint and know what it cannot see, and report bugs through bounties and responsible disclosure.
minutes: 40
objectives:
  - Describe the stages of an audit and what an audit report does and does not promise
  - Rate a finding's severity from its impact and likelihood
  - Write a finding with a description, impact, a proof of concept as a Foundry test, and a recommendation
  - Run forge lint, read its output, and explain which bugs it cannot find
---

## Outline

1. What an audit is, and is not
2. How an audit runs
3. Severity: impact and likelihood
4. Writing a finding with a proof of concept
5. Review checklists and tools
6. Bug bounties and responsible disclosure

## What an audit is, and is not

An **audit** is a time-boxed review of a fixed version of the code by people who did not write it,
ending in a report of **findings**. It lowers risk; it does not certify that code is safe. Auditors
read only the commit and files in **scope**, for a few days or weeks, so code changed after the
audit, contracts outside the scope, and assumptions nobody wrote down are not covered. Many hacked
protocols had been audited. Treat the audit as one layer, next to your own tests, invariants
(Advanced 10), a bug bounty and monitoring (lesson 09).

## How an audit runs

1. **Scoping.** You freeze a commit and write down what the system should do: roles, invariants,
   which tokens it accepts, what is trusted. Unclear intent produces findings about intent.
2. **Threat modelling and manual review.** Auditors map assets, actors and entry points (Advanced
   01), then read every line, asking who can call each function, with what values, in what state.
3. **Tools.** Static analysis, fuzzing and invariant tests support the reading.
4. **Report.** Findings with a severity, then a **fix review**: auditors check each fix and record
   it as fixed, acknowledged or disputed.

Competitive audits (contests) let many reviewers look at once and pay per finding; a private audit
firm gives depth and a named team. Serious protocols often do both.

## Severity: impact and likelihood

**Impact** is how bad the worst outcome is: high when funds are stolen or frozen, medium for
indirect loss or broken functionality, low when no value is at risk. **Likelihood** is how easily it
happens: high when anyone can do it now, low when it needs unlikely conditions or a privileged role.
A common matrix, from CodeHawks:

| Likelihood \ Impact | High | Medium | Low |
| --- | --- | --- | --- |
| High | High | Medium | Medium |
| Medium | Medium | Medium | Low |
| Low | Medium | Low | Low |

Gas savings and style are informational. Rating a finding higher than its evidence supports costs
the reviewer credibility.

## Writing a finding with a proof of concept

This tip jar is under review:

```solidity
contract TipJar {
    IERC20 public immutable token;
    address public treasury;
    uint256 public feeBps = 250;
    mapping(address => uint256) public owed;

    constructor(IERC20 token_, address treasury_) {
        token = token_;
        treasury = treasury_;
    }

    function tip(address to, uint256 amount) external {
        token.transferFrom(msg.sender, address(this), amount);
        uint256 fee = amount / 10_000 * feeBps;
        owed[treasury] += fee;
        owed[to] += amount - fee;
    }

    function claim() external {
        uint256 amount = owed[msg.sender];
        owed[msg.sender] = 0;
        token.transfer(msg.sender, amount);
    }

    function setTreasury(address treasury_) external {
        treasury = treasury_;
    }
}
```

A **proof of concept** (PoC) is a test that shows the bug happening. It turns "this might be
exploitable" into a fact the developers can run:

```solidity
/// H-01: anyone can make themselves the treasury and claim every later fee.
function test_H01_anyone_redirects_the_fees() public {
    vm.prank(mallory);
    jar.setTreasury(mallory);
    vm.prank(alice);
    jar.tip(bob, 100_000);
    vm.prank(mallory);
    jar.claim();
    console.log("mallory's balance:", coin.balanceOf(mallory));
    console.log("treasury owed:", jar.owed(treasury));
}

/// M-01: the fee is rounded down to whole multiples of 10,000 before it is multiplied.
function test_M01_fee_rounding() public {
    vm.startPrank(alice);
    jar.tip(bob, 9_999);
    console.log("fee on 9,999:", jar.owed(treasury));
    jar.tip(bob, 19_999);
    console.log("fee on 9,999 + 19,999:", jar.owed(treasury));
    vm.stopPrank();
}
```

```text
[PASS] test_H01_anyone_redirects_the_fees() (gas: 231471)
Logs:
  mallory's balance: 2500
  treasury owed: 0

[PASS] test_M01_fee_rounding() (gas: 204532)
Logs:
  fee on 9,999: 0
  fee on 9,999 + 19,999: 250
```

The written finding states the problem, why it matters, the proof and the fix:

```text
[H-01] Anyone can redirect protocol fees with setTreasury
Severity: High (impact high: theft of every future fee; likelihood high: one call, no conditions)
Description: TipJar.setTreasury has no access control, and tip() credits fees to whatever
  address `treasury` holds at that moment.
Impact: An attacker calls setTreasury(attacker) and then claims all fees from later tips.
Proof of concept: test_H01_anyone_redirects_the_fees (above): Mallory claims 2,500 of the
  2,500 fee on a 100,000 tip; the real treasury is owed 0.
Recommendation: Restrict setTreasury to an owner (Ownable2Step, held by a multisig), reject
  address(0), and emit TreasuryChanged(previous, next).
```

A PoC that passes on the vulnerable code becomes, after the fix, a regression test that expects the
revert. M-01 is Medium by the matrix: a small loss per tip, but on every tip.

## Review checklists and tools

A checklist keeps a review systematic. For every contract: who may call each state-changing
function, and is that enforced (Advanced 03)? Is state updated before every external call (Advanced
02)? Are return values and failed calls handled (`SafeERC20`, Advanced 09)? Does arithmetic multiply
before dividing and round in the protocol's favour (Advanced 04)? Can prices or signatures be
manipulated or replayed (Advanced 06, 07)? Are initializers and upgrades protected (lesson 03)? Do
loops have bounds? Do admin changes emit events?

`forge lint` checks patterns in Foundry projects. By default it reports high, medium and low
severity; `--severity info gas` shows the rest. On the tip jar it printed five warnings, among them:

```text
warning[divide-before-multiply]: division before multiplication may lose precision
   ╭▸ src/TipJar.sol:20:23
   │
20 │         uint256 fee = amount / 10_000 * feeBps;
   │                       ━━━━━━━━━━━━━━━━━━━━━━━━
   │
   ╰ help: https://getfoundry.sh/forge/linting/divide-before-multiply

warning[missing-zero-check]: address parameter is used in a state write or value transfer without a zero-address check
   ╭▸ src/TipJar.sol:31:26
   │
31 │     function setTreasury(address treasury_) external {
   │                          ━━━━━━━━━━━━━━━━━
   │
   ╰ help: https://getfoundry.sh/forge/linting/missing-zero-check
```

The others were `erc20-unchecked-transfer` twice and a second `missing-zero-check`. It found M-01
but not H-01: it noticed the zero-address risk in `setTreasury` and missed that anyone can call it,
because whether a caller should be allowed is a question about intent. Slither (Trail of Bits) and
Aderyn (Cyfrin) are static analysers with more detectors, run the same way (`slither .`, `aderyn .`)
outside this sandbox. Run them in CI, triage every result, and never mistake a clean run for a
review.

## Bug bounties and responsible disclosure

A **bug bounty** pays outsiders for vulnerabilities in live code, usually through a platform such as
Immunefi, with rewards by severity. Publish one, with a security contact (`SECURITY.md`), before
launch. If you find a bug in someone else's contract, practise **responsible disclosure**: report
privately to the project's security contact or bounty, include the PoC, never test on mainnet (use a
local fork), and do not publish until it is fixed. During an active exploit, SEAL 911, a volunteer
emergency service of the Security Alliance, connects projects with experienced responders.

## Common mistakes

- **Treating tool output as the review.** Above, `forge lint` missed the High finding.
- **Fixing the line, not the bug.** If one function lacks a check, search for every function like
  it. In this lesson's lab, guarding `award` alone leaves `awardEqually` open, and a stranger's call
  there still succeeds.
- **A PoC that asserts nothing.** Log or assert the stolen amount; "it ran" proves nothing.
- **A regression test that cannot fail.** A bare `vm.expectRevert()` passes on any revert, even an
  unrelated one. Expect the exact error, as `OwnableUnauthorizedAccount(mallory)` below, and get
  every change made after the audit reviewed too.

## Practice

1. Rate a bug that lets anyone freeze every user's withdrawals permanently with one call.
2. Fix H-01 and M-01 in `TipJar` and write a regression test for each.
3. Why is `missing-zero-check` on the constructor not a High finding?

### Answers

```solidity
contract TipJar is Ownable2Step {
    // ... SafeERC20 for both transfers, FEE_BPS a constant, an event and ZeroAddress error
    function tip(address to, uint256 amount) external {
        token.safeTransferFrom(msg.sender, address(this), amount);
        uint256 fee = amount * FEE_BPS / 10_000; // M-01: multiply first
        owed[treasury] += fee;
        owed[to] += amount - fee;
    }

    function setTreasury(address treasury_) external onlyOwner {
        if (treasury_ == address(0)) revert ZeroAddress();
        emit TreasuryChanged(treasury, treasury_);
        treasury = treasury_;
    }
}

function test_H01_strangers_cannot_move_the_treasury() public {
    vm.prank(mallory);
    vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, mallory));
    jar.setTreasury(mallory);
}

function test_M01_fee_is_exact() public {
    vm.prank(alice);
    jar.tip(bob, 19_999);
    assertEq(jar.owed(treasury), 499, "the fee on a tip of 19,999");
}
```

```text
[PASS] test_H01_strangers_cannot_move_the_treasury() (gas: 36330)
[PASS] test_M01_fee_is_exact() (gas: 124661)
```

`forge lint` reports nothing on the fixed file.

1. High: impact high (funds frozen), likelihood high (anyone, one call).
3. Only the deployer sets it, once, and a mistake is visible at once: low likelihood, so Low or
   informational.

## Key takeaways

- An audit is a time-boxed review of one commit; it lowers risk and certifies nothing.
- Severity combines impact and likelihood; a finding needs a description, impact, PoC and fix.
- A Foundry PoC proves the bug and becomes the regression test for the fix.
- Linters find patterns, not intent; bounties and responsible disclosure cover what audits miss.

## Further reading

- [Foundry: Linting with forge lint](https://getfoundry.sh/forge/linting)
- [CodeHawks: Findings severity](https://docs.cyfrin.io/codehawks/findings-severity)
- [OWASP Smart Contract Top 10](https://owasp.org/www-project-smart-contract-top-10/)
- [Immunefi Vulnerability Severity Classification System](https://immunefi.com/immunefi-vulnerability-severity-classification-system-v2-3/)
