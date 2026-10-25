---
title: "Putting It Together: a Complete Contract"
summary: Build a crowdfunding escrow from requirements to a reviewed, tested contract, using state, custom errors, events, modifiers and pull payments, and meet fuzz testing with bound and vm.assume.
minutes: 45
objectives:
  - Turn written requirements into state, errors, events and a small state machine
  - Combine access control, checks-effects-interactions and pull payments in one contract
  - Write a test suite that covers every path, including the refused ones
  - Write fuzz tests with bound and vm.assume, and read a counterexample when one fails
---

## Outline

1. Requirements
2. Designing the state
3. The contract
4. Unit tests
5. Fuzz testing
6. A review checklist

## Requirements

A village wants a bench by the pond. The organiser collects pledges in a contract, so that
nobody has to trust one person with a jar of cash:

1. The organiser deploys the fund with a goal in wei, which must not be zero.
2. While the fund is open, anyone may pledge any amount above zero, as often as they like.
3. Only the organiser closes the fund. It **succeeds** if the pledges reached the goal, and
   **fails** otherwise.
4. A successful fund pays everything to the organiser, once.
5. In a failed fund, each backer takes back exactly what they pledged.
6. Every change is announced with an event, and every refusal names its reason.

Write requirements like these before any code: each becomes a check, and each check a test.

## Designing the state

The fund moves through stages, and each function is allowed in one of them. An `enum` (lesson
03) makes these stages explicit: `Open`, then `Succeeded` or `Failed`, and `PaidOut` after the
payout. One `inState` modifier with an argument (lesson 10) guards them all. The organiser and
the goal never change, so they are `immutable`. A mapping records each backer's pledges, because
refunds must return exactly that amount; `address(this).balance` is never used as the books
(lesson 11). Money only leaves through two functions that the receiver calls: pull payments.

## The contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Bench fund
/// @notice Pledges towards a bench: paid to the organiser if the goal is met, refunded if not.
contract BenchFund {
    enum State {
        Open,
        Succeeded,
        Failed,
        PaidOut
    }

    address public immutable organiser;
    uint256 public immutable goal;
    State public state;
    uint256 public totalPledged;
    mapping(address => uint256) public pledgeOf;

    event Pledged(address indexed backer, uint256 amount);
    event Closed(State outcome, uint256 totalPledged);
    event PaidOut(address indexed organiser, uint256 amount);
    event Refunded(address indexed backer, uint256 amount);

    error ZeroAmount();
    error NotOrganiser(address caller);
    error WrongState(State current);
    error NothingToRefund();
    error TransferFailed(address to, uint256 amount);

    modifier onlyOrganiser() {
        if (msg.sender != organiser) revert NotOrganiser(msg.sender);
        _;
    }

    modifier inState(State expected) {
        if (state != expected) revert WrongState(state);
        _;
    }

    constructor(uint256 goal_) {
        if (goal_ == 0) revert ZeroAmount();
        organiser = msg.sender;
        goal = goal_;
    }

    /// @notice Pledge the ether sent with this call.
    function pledge() external payable inState(State.Open) {
        if (msg.value == 0) revert ZeroAmount();
        pledgeOf[msg.sender] += msg.value;
        totalPledged += msg.value;
        emit Pledged(msg.sender, msg.value);
    }

    /// @notice End pledging; the fund succeeds if the goal was reached.
    function close() external onlyOrganiser inState(State.Open) {
        state = totalPledged >= goal ? State.Succeeded : State.Failed;
        emit Closed(state, totalPledged);
    }

    /// @notice Pay everything pledged to the organiser, once.
    function payOut() external onlyOrganiser inState(State.Succeeded) {
        state = State.PaidOut; // effects before the interaction
        _send(organiser, totalPledged);
        emit PaidOut(organiser, totalPledged);
    }

    /// @notice Take back your pledges from a fund that failed.
    function claimRefund() external inState(State.Failed) {
        uint256 amount = pledgeOf[msg.sender];
        if (amount == 0) revert NothingToRefund();
        pledgeOf[msg.sender] = 0;
        _send(msg.sender, amount);
        emit Refunded(msg.sender, amount);
    }

    function _send(address to, uint256 amount) private {
        (bool ok,) = to.call{value: amount}("");
        if (!ok) revert TransferFailed(to, amount);
    }
}
```

Every function follows the same order, called **checks-effects-interactions**: modifiers and
`if` checks first, then the state changes, then the ether leaves. `payOut` moves to `PaidOut`
before sending, so a second call is refused even from inside the payment.

## Unit tests

The test file in `test/` imports the contract. `setUp` deploys the fund as the organiser and gives
two backers ether; a small internal helper keeps the tests short. Here are two of the six:

```solidity
contract BenchFundTest is Test {
    uint256 constant GOAL = 10 ether;
    address organiser = address(0x0e6);
    address ada = address(0xA11CE);
    address bo = address(0xB0);
    BenchFund fund;

    function setUp() public {
        vm.prank(organiser);
        fund = new BenchFund(GOAL);
        vm.deal(ada, 100 ether);
        vm.deal(bo, 100 ether);
    }

    function _pledge(address backer, uint256 amount) internal {
        vm.prank(backer);
        fund.pledge{value: amount}();
    }

    function test_success_pays_the_organiser() public {
        _pledge(ada, 6 ether);
        _pledge(bo, 4 ether);
        vm.prank(organiser);
        fund.close();
        assertEq(uint256(fund.state()), uint256(BenchFund.State.Succeeded), "state after reaching the goal");

        vm.prank(organiser);
        fund.payOut();
        assertEq(organiser.balance, GOAL, "organiser's ether after the payout");

        vm.prank(organiser);
        vm.expectRevert(abi.encodeWithSelector(BenchFund.WrongState.selector, BenchFund.State.PaidOut));
        fund.payOut();
    }

    function test_only_the_organiser_closes() public {
        vm.prank(ada);
        vm.expectRevert(abi.encodeWithSelector(BenchFund.NotOrganiser.selector, ada));
        fund.close();
    }
}
```

`forge test` on the whole suite, which also checks refunds, late pledges, empty pledges and a
zero goal:

```text
Ran 6 tests for test/BenchFund.t.sol:BenchFundTest
[PASS] testFuzz_failed_fund_refunds_everyone(uint256,uint256) (runs: 256, μ: 271679, ~: 271928)
[PASS] test_failure_refunds_backers() (gas: 199008)
[PASS] test_no_pledges_after_closing() (gas: 92834)
[PASS] test_only_the_organiser_closes() (gas: 33032)
[PASS] test_rejects_empty_pledges_and_goals() (gas: 205956)
[PASS] test_success_pays_the_organiser() (gas: 277714)
```

## Fuzz testing

Unit tests check the cases you thought of. A **fuzz test** checks a **property**, a rule that
must hold for every input, by trying many inputs for you. Any test function with parameters is
one: forge calls it 256 times with generated values, biased towards interesting ones such as
0, `type(uint256).max` and the literals in your code. `runs: 256` above means all 256 passed; `μ`
and `~` are the mean and median gas. The lab sandbox fixes the fuzzer's seed, so every run
picks the same inputs.

Raw inputs are usually far too large, so shape them:

- **`bound(x, min, max)`** (from forge-std) maps any value into `min..max`; every run counts.
- **`vm.assume(condition)`** throws a run away when the condition is false. Use it for rare
  exclusions, not for ranges.

```solidity
function testFuzz_failed_fund_refunds_everyone(uint256 fromAda, uint256 fromBo) public {
    fromAda = bound(fromAda, 1, GOAL - 1);
    fromBo = bound(fromBo, 1, GOAL - 1);
    vm.assume(fromAda + fromBo < GOAL); // only funds that fail

    _pledge(ada, fromAda);
    _pledge(bo, fromBo);
    vm.prank(organiser);
    fund.close();
    vm.prank(ada);
    fund.claimRefund();
    vm.prank(bo);
    fund.claimRefund();

    assertEq(ada.balance, 100 ether, "Ada's ether after her refund");
    assertEq(bo.balance, 100 ether, "Bo's ether after his refund");
    assertEq(address(fund).balance, 0, "ether left in the fund");
}
```

To see a fuzz test catch a bug, change `>=` in `close` to `>` and add the property "a fund
that reaches its goal succeeds":

```solidity
function testFuzz_reaching_the_goal_succeeds(uint256 amount) public {
    amount = bound(amount, GOAL, 100 ether);
    _pledge(ada, amount);
    vm.prank(organiser);
    fund.close();
    assertEq(uint256(fund.state()), uint256(BenchFund.State.Succeeded), "state after reaching the goal");
}
```

Two tests now fail:

```text
[FAIL: state after reaching the goal: 2 != 1; counterexample: calldata=0x863d13850000000000000000000000000000000000000000000000000000000000000000 args=[0]] testFuzz_reaching_the_goal_succeeds(uint256) (runs: 34, μ: 142742, ~: 142862)
[FAIL: state after reaching the goal: 2 != 1] test_success_pays_the_organiser() (gas: 206919)
```

The **counterexample** shows the raw input, 0, which `bound` turned into exactly `GOAL`: a
pledge that meets the goal left the fund `Failed` (2) instead of `Succeeded` (1). The unit test
caught it only because its pledges happen to add up to exactly 10 ether; the fuzzer looks for
such boundaries on its own. Forge also saves a failing input under `cache/fuzz` and tries it
first on the next run.

## A review checklist

Before calling a contract done, read it once more against this list:

- Every external function: who may call it, and in which state? Is there a test for a refused
  caller?
- Checks, then effects, then interactions; state updated before any ether is sent.
- Every `call` result checked; no `transfer`, `send` or `tx.origin`.
- Your own books in mappings, not `address(this).balance`.
- A custom error for each refusal and an event for each change, both tested.
- Properties fuzzed: totals add up, nobody gets back more than they paid.

## Common mistakes

- **Filtering too much with `vm.assume`.** When most inputs are thrown away, the test fails:
  `` [FAIL: `vm.assume` rejected too many inputs (65536 allowed)] ``. Clamp ranges with `bound`.
- **`>` where the rules say "reached".** The off-by-one above. Fuzz the boundary with `bound`.
- **Passing enums to `assertEq`.** forge-std has no `assertEq` for enums:
  `Error (9322): No matching declaration found after argument-dependent lookup.` Convert both
  sides, `uint256(fund.state())` and `uint256(BenchFund.State.Succeeded)`, as the tests do.
- **Testing only the happy path.** For each `revert` in the contract, write the test that
  triggers it.

## Practice

1. Test that a backer who pledged 1 and then 2 ether to a failed fund gets 3 ether back in one
   `Refunded` event.
2. Fuzz the property "after two pledges, `totalPledged` is their sum and equals the ether held".
3. `payOut` sets `PaidOut` before sending. What could the organiser's contract wallet do if it
   sent first?

### Answers

```solidity
function test_two_pledges_one_refund() public {
    _pledge(ada, 1 ether);
    _pledge(ada, 2 ether);
    vm.prank(organiser);
    fund.close();

    vm.expectEmit(address(fund));
    emit BenchFund.Refunded(ada, 3 ether);
    vm.prank(ada);
    fund.claimRefund();
}

function testFuzz_total_matches_the_ether_held(uint256 fromAda, uint256 fromBo) public {
    fromAda = bound(fromAda, 1, 100 ether);
    fromBo = bound(fromBo, 1, 100 ether);
    _pledge(ada, fromAda);
    _pledge(bo, fromBo);
    assertEq(fund.totalPledged(), fromAda + fromBo, "total of two pledges");
    assertEq(address(fund).balance, fund.totalPledged(), "ether held equals the total");
}
```

```text
[PASS] testFuzz_total_matches_the_ether_held(uint256,uint256) (runs: 256, μ: 162784, ~: 162907)
[PASS] test_two_pledges_one_refund() (gas: 217233)
```

3. Its `receive` could call `payOut` again while the state was still `Succeeded`, and be paid
   twice from other people's money. Advanced 02 builds this reentrancy attack.

## Key takeaways

- Write the requirements first; each one becomes a check and a test.
- An enum with an `inState` modifier keeps a contract's stages explicit.
- Checks, effects, interactions; pull payments; your own books.
- Fuzz tests check properties over many inputs; shape inputs with `bound`, exclude rare cases
  with `vm.assume`, and read the counterexample when one fails.

## Further reading

- [Foundry documentation: Fuzz testing](https://getfoundry.sh/forge/fuzz-testing/)
- [Solidity documentation: Use the Checks-Effects-Interactions Pattern](https://docs.soliditylang.org/en/latest/security-considerations.html#use-the-checks-effects-interactions-pattern)
- [Solidity documentation: Withdrawal from Contracts](https://docs.soliditylang.org/en/latest/common-patterns.html#withdrawal-from-contracts)
