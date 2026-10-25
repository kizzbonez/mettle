---
title: Payment Patterns and State Machines
summary: Pay people safely with the withdrawal pattern, order every function as checks, effects, interactions, model an escrow as a state machine with an enum and atStage modifiers, let deadlines move the state, and split money so that no wei is lost or overpaid.
minutes: 40
objectives:
  - Explain why push payments let one recipient block everyone, and replace them with pull payments
  - Write a withdraw function in checks-effects-interactions order and say what goes wrong in any other order
  - Model a contract as a state machine with an enum, an atStage modifier and a timedTransitions modifier
  - Split an amount among several people so that the shares add up to exactly the total, and prove it with a fuzz test
---

## Outline

1. Push payments, and why one recipient can block everyone
2. Pull payments: credit first, withdraw later
3. Checks, effects, interactions
4. An escrow as a state machine
5. Deadlines that move the state
6. Splitting money fairly

## Push payments, and why one recipient can block everyone

A **push payment** sends ether to people as part of some other action, often in a loop. It looks
natural, and it is fragile: every recipient gets a say in whether your function succeeds.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Pays every winner in one loop: a push payment. Do not copy this.
contract PrizePush {
    address[] public winners;

    error TransferFailed(address to);

    constructor(address[] memory winners_) payable {
        winners = winners_;
    }

    function payOut() external {
        uint256 share = address(this).balance / winners.length;
        for (uint256 i = 0; i < winners.length; i++) {
            (bool ok,) = winners[i].call{value: share}("");
            if (!ok) revert TransferFailed(winners[i]);
        }
    }
}
```

A test makes the second winner a contract whose `receive` function reverts:

```text
[FAIL: TransferFailed(0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f)] test_OneRefuserBlocksEveryone() (gas: 620936)
```

The whole payout reverts, so the other winners get nothing either, today or ever. Ignoring `ok`
instead would quietly keep the refuser's share in the contract. A recipient can refuse by
accident (a wallet contract without `receive`) or on purpose, to hold everyone else hostage. A
long list can also run out of gas (Advanced 09).

## Pull payments: credit first, withdraw later

The **withdrawal pattern**, also called **pull payment**, separates the two steps. The action
only records what each person is owed in a mapping, and each person calls `withdraw` to take
their own money. A refusing recipient now only fails its own withdrawal. The Solidity
documentation recommends this pattern, and **refunds** work the same way: credit the refund, let
the payer pull it.

OpenZeppelin 4.x shipped `PullPayment` and escrow contracts; version 5.0 removed them. The
pattern is a few lines that you write around your own state.

## Checks, effects, interactions

Every function that changes state and calls out follows the **checks-effects-interactions**
order:

1. **Checks**: validate the caller, the stage, the amounts; revert early.
2. **Effects**: update your own storage.
3. **Interactions**: call other contracts or send ether, last.

An external call hands control to code you do not control, and that code can call your contract
back before your function has finished. If `owed[msg.sender]` were zeroed after the `call`, the
recipient's `receive` could call `withdraw` again and be paid twice. With the effects first, a
callback sees the updated state and gets nothing. Advanced 02 shows the attack in full; make the
order a habit now.

## An escrow as a state machine

Many contracts move through **stages**: an escrow waits for payment, holds it, then releases or
refunds it. Model the stage as an enum, allow each function only in its stage with an **`atStage`
modifier**, and move between stages in one place that emits an event:

```solidity
contract ParcelEscrow {
    enum Stage {
        AwaitingPayment,
        Paid,
        Expired,
        Released,
        Refunded
    }

    address public immutable buyer;
    address public immutable seller;
    uint256 public immutable price;
    uint256 public immutable confirmBy;
    Stage public stage;
    mapping(address => uint256) public owed;

    event StageChanged(Stage from, Stage to);

    error WrongStage(Stage expected, Stage actual);
    error NotBuyer(address caller);
    error WrongAmount(uint256 sent);
    error NothingOwed(address who);
    error TransferFailed(address to);

    constructor(address seller_, uint256 price_, uint256 confirmBy_) {
        buyer = msg.sender;
        seller = seller_;
        price = price_;
        confirmBy = confirmBy_;
    }

    modifier onlyBuyer() {
        if (msg.sender != buyer) revert NotBuyer(msg.sender);
        _;
    }

    /// Time moves the stage: put this before atStage.
    modifier timedTransitions() {
        if (stage == Stage.Paid && block.timestamp > confirmBy) _moveTo(Stage.Expired);
        _;
    }

    modifier atStage(Stage expected) {
        if (stage != expected) revert WrongStage(expected, stage);
        _;
    }

    function pay() external payable onlyBuyer atStage(Stage.AwaitingPayment) {
        if (msg.value != price) revert WrongAmount(msg.value);
        _moveTo(Stage.Paid);
    }

    function confirmDelivery() external onlyBuyer timedTransitions atStage(Stage.Paid) {
        _moveTo(Stage.Released);
        owed[seller] += price;
    }

    function claimRefund() external onlyBuyer timedTransitions atStage(Stage.Expired) {
        _moveTo(Stage.Refunded);
        owed[buyer] += price;
    }

    /// @notice Pull payment: each party takes what it is owed.
    function withdraw() external {
        uint256 amount = owed[msg.sender]; // checks
        if (amount == 0) revert NothingOwed(msg.sender);
        owed[msg.sender] = 0; // effects
        (bool ok,) = msg.sender.call{value: amount}(""); // interaction, last
        if (!ok) revert TransferFailed(msg.sender);
    }

    function _moveTo(Stage next) private {
        emit StageChanged(stage, next);
        stage = next;
    }
}
```

The money never moves during a stage change: confirming or refunding only credits `owed`, and
`withdraw` is the single place ether leaves. Every change of stage goes through `_moveTo`, so its
events record the whole history, and a test can walk through every transition.

## Deadlines that move the state

Nothing on a chain runs by itself when a deadline passes; a contract only notices time when
someone calls it. The **`timedTransitions`** modifier applies the time rule at the start of
every call, which is why it must come before `atStage`: modifiers run left to right. The
tests, with the buyer paying 1 ether in `setUp` and 14 days to confirm:

```text
Ran 4 tests for test/ParcelEscrow.t.sol:ParcelEscrowTest
[PASS] test_ConfirmThenSellerWithdraws() (gas: 93776)
[PASS] test_RefundAfterTheDeadline() (gas: 97854)
[PASS] test_RevertWhen_ConfirmingTooLate() (gas: 45248)
[PASS] test_RevertWhen_PayingTwice() (gas: 43114)
```

`test_RevertWhen_ConfirmingTooLate` expects `WrongStage(Paid, Expired)` and then checks that
`stage()` still reads `Paid`: the modifier did move to `Expired`, but the revert undid that with
everything else. The stored stage is updated only by a call that succeeds, here `claimRefund`.
Until then the public getter is stale, so a front end should apply the same time rule (a
`currentStage()` view does that for it).

## Splitting money fairly

Integer division truncates, so dividing 1 ether among three leaves wei that belong to nobody.
Decide where the **remainder** goes, and make the shares add up to exactly the total: never more
(the last withdrawal would fail) and never less (wei stuck forever).

```solidity
/// @notice `n` shares of `total` wei that add up to exactly `total`: share 0 takes the remainder.
function splitEvenly(uint256 total, uint256 n) pure returns (uint256[] memory shares) {
    shares = new uint256[](n);
    uint256 each = total / n;
    for (uint256 i = 0; i < n; i++) {
        shares[i] = each;
    }
    shares[0] += total % n;
}
```

A test prints the split of 1 ether, then what plain division would leave behind; a fuzz test
checks the sum for any total up to 1e30 wei and up to 20 people:

```text
[PASS] testFuzz_SharesAddUpToTheTotal(uint256,uint256) (runs: 256, μ: 8790, ~: 9163)
[PASS] test_OneEtherThreeWays() (gas: 8942)
Logs:
  333333333333333334 333333333333333333 333333333333333333
  plain division leaves: 1
```

For weighted splits (70% and 30%), compute every share but the last as `amount * weight` divided
by the sum of the weights, and give the last one `amount` minus the others, so rounding never
creates or loses wei.

## Common mistakes

- **Paying in a loop.** One reverting recipient blocks everyone:
  `[FAIL: TransferFailed(0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f)]`. Credit balances and let
  each recipient withdraw.
- **Zeroing the balance after the call.** A recipient whose `receive` calls `withdraw` again is
  paid twice. Owed 1 ether next to someone else's 1 ether, a test contract took both:
  `the taker received: 2000000000000000000`. Set `owed[msg.sender] = 0` before sending.
- **`atStage` before `timedTransitions`.** The guard checks the old stage, so after the deadline
  `claimRefund` reverts with `WrongStage(2, 1)` and the refund can never be claimed. List
  `timedTransitions` first.
- **Dividing and forgetting the remainder.** `total / n` for each of three people leaves 1 wei of
  1 ether in the contract for ever. Give the remainder to someone, and fuzz that the shares sum to
  the total.

## Practice

1. Split 100 wei among 7 people with `splitEvenly`. What is share 0?
2. Write `splitWeighted(uint256 amount, uint256[] memory weights)` that gives every share but the
   last `amount * weights[i] / sum` and the last the rest. Split 1 ether at 1:1:1.
3. In the escrow, which stages can `withdraw` succeed in, and why does it need no `atStage`?

### Answers

```solidity
function splitWeighted(uint256 amount, uint256[] memory weights) pure returns (uint256[] memory shares) {
    uint256 sum;
    for (uint256 i = 0; i < weights.length; i++) {
        sum += weights[i];
    }
    shares = new uint256[](weights.length);
    uint256 given;
    for (uint256 i = 0; i + 1 < weights.length; i++) {
        shares[i] = amount * weights[i] / sum;
        given += shares[i];
    }
    shares[weights.length - 1] = amount - given;
}
```

```text
  share 0 of 100 wei among 7: 16
  1:1:1 of 1 ether: 333333333333333333 333333333333333333 333333333333333334
```

Answer 3: in `Released` (the seller) and `Refunded` (the buyer), because only those transitions
credit `owed`. The balance in `owed` is the permission: anyone with nothing owed gets
`NothingOwed`.

## Key takeaways

- Push payments let any recipient block or burden everyone; credit balances and let people pull.
- Checks, effects, interactions: the external call always comes last.
- An enum, an `atStage` modifier and one `_moveTo` function make a contract's life explicit.
- Deadlines act only when someone calls; apply them with `timedTransitions` before `atStage`,
  and remember that a revert undoes the transition too.
- Shares must add up to the total: decide who gets the remainder, and fuzz the sum.

## Further reading

- [Solidity documentation: Common Patterns](https://docs.soliditylang.org/en/latest/common-patterns.html)
- [Solidity documentation: Security Considerations](https://docs.soliditylang.org/en/latest/security-considerations.html)
- [OpenZeppelin Contracts 5.0 changelog](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/CHANGELOG.md)
