---
title: Modifiers and Access Control
summary: Wrap functions in modifiers, write onlyOwner by hand, hand ownership over in two steps, give roles with a mapping, pause a contract, and see why tx.origin must never decide who may act.
minutes: 35
objectives:
  - Write modifiers with and without arguments and predict the order in which stacked modifiers run
  - Restrict functions to an owner with a hand-written onlyOwner modifier and a custom error
  - Transfer ownership in two steps and grant or revoke simple roles stored in a mapping
  - Pause and unpause a contract, and explain why authorization uses msg.sender and never tx.origin
---

## Outline

1. Modifiers wrap a function
2. An owner, by hand
3. Handing ownership over in two steps
4. Roles with a mapping, and pausing
5. Never authorize with tx.origin

## Modifiers wrap a function

Every public or external function of a deployed contract can be called by any account. **Access
control** is the code that decides who may do what, and a missing check is one of the most
common ways real contracts lose money. Solidity's tool for writing such checks once is the
**modifier**: a named piece of code that wraps a function. The function's body runs where the
modifier says **`_;`**. A modifier can take arguments, and when a function lists several, they
run left to right, each wrapping the next:

```solidity
contract Wrapped {
    uint256 public runs;

    modifier announce(string memory name) {
        console.log(name, "before");
        _;
        console.log(name, "after");
    }

    function run() external announce("outer") announce("inner") {
        runs += 1;
        console.log("body");
    }
}
```

Calling `run()` from a test:

```text
[PASS] test_order() (gas: 432669)
Logs:
  outer before
  inner before
  body
  inner after
  outer after
```

Nearly every modifier you write is a guard: check, revert if the check fails, then `_;`. If
the check reverts, the body never runs and the whole call is undone (lesson 05).

## An owner, by hand

The simplest policy is one **owner**, usually the deployer, recorded in the constructor:

```solidity
contract BoatShed {
    address public owner;
    uint256 public hireFee;

    error NotOwner(address caller);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner(msg.sender);
        _;
    }

    function setHireFee(uint256 fee) external onlyOwner {
        hireFee = fee;
    }
}

contract BoatShedTest is Test {
    BoatShed shed = new BoatShed();
    address stranger = address(0xBAD);

    function test_owner_sets_the_fee() public {
        shed.setHireFee(5 gwei);
        assertEq(shed.hireFee(), 5 gwei, "fee after the owner set it");
    }

    function test_stranger_is_refused() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(BoatShed.NotOwner.selector, stranger));
        shed.setHireFee(0);
    }

    function test_what_the_stranger_sees() public {
        vm.prank(stranger);
        shed.setHireFee(0);
    }
}
```

```text
[PASS] test_owner_sets_the_fee() (gas: 54688)
[PASS] test_stranger_is_refused() (gas: 35830)
[FAIL: NotOwner(0x0000000000000000000000000000000000000Bad)] test_what_the_stranger_sees() (gas: 34644)
```

The third test shows what a stranger's wallet would report. The error names the caller, which
makes failed transactions easy to diagnose. Test both sides of every guard: the allowed caller
succeeds, and everyone else is refused with the exact error.

## Handing ownership over in two steps

Owners change. A one-step `transferOwnership(newOwner)` that assigns at once is dangerous: one
mistyped address, or the zero address, and nobody can ever call the owner's functions again.
**Two-step ownership** fixes this. The owner only offers; the new owner must accept from their
own account, which proves the address is right and controlled by someone:

```solidity
address public pendingOwner;

event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

error NotPendingOwner(address caller);

/// @notice Offer ownership to `newOwner`; nothing changes until they accept.
function transferOwnership(address newOwner) external onlyOwner {
    pendingOwner = newOwner;
    emit OwnershipTransferStarted(owner, newOwner);
}

/// @notice Accept the ownership that was offered to you.
function acceptOwnership() external {
    if (msg.sender != pendingOwner) revert NotPendingOwner(msg.sender);
    emit OwnershipTransferred(owner, msg.sender);
    owner = msg.sender;
    pendingOwner = address(0);
}

// in the test contract, with bea = address(0xBEA)
function test_two_step_handover() public {
    shed.transferOwnership(bea);
    assertEq(shed.owner(), address(this), "owner before the offer is accepted");

    vm.prank(address(0xBAD));
    vm.expectRevert(abi.encodeWithSelector(BoatShed.NotPendingOwner.selector, address(0xBAD)));
    shed.acceptOwnership();

    vm.expectEmit(address(shed));
    emit BoatShed.OwnershipTransferred(address(this), bea);
    vm.prank(bea);
    shed.acceptOwnership();
    assertEq(shed.owner(), bea, "owner after accepting");

    vm.expectRevert(abi.encodeWithSelector(BoatShed.NotOwner.selector, address(this)));
    shed.setHireFee(1);
}
```

```text
[PASS] test_two_step_handover() (gas: 163982)
```

Until Bea accepts, the old owner stays in charge and can offer again to correct a mistake.
Clearing `pendingOwner` stops a stale offer from being accepted later. Every change of power
emits an event, so the club can see who controls the shed. OpenZeppelin's `Ownable2Step` works
the same way (Medium 11).

## Roles with a mapping, and pausing

One owner rarely does everything. A **role** is a permission given to many accounts, stored in
a mapping (lesson 07) that the owner manages. Pausing is a special switch: an owner who spots a
problem can stop risky actions while it is fixed. Both are modifiers:

```solidity
// in BoatShed, which also declares NotSteward, ShedPaused, StewardSet, Paused and BoatLent
mapping(address => bool) public isSteward;
bool public paused;

modifier onlySteward() {
    if (!isSteward[msg.sender]) revert NotSteward(msg.sender);
    _;
}

modifier whenNotPaused() {
    if (paused) revert ShedPaused();
    _;
}

function setSteward(address account, bool allowed) external onlyOwner {
    isSteward[account] = allowed;
    emit StewardSet(account, allowed);
}

function pause() external onlyOwner {
    paused = true;
    emit Paused(msg.sender);
}

function lendBoat(uint256 boatId, address member) external onlySteward whenNotPaused {
    borrowerOf[boatId] = member;
    emit BoatLent(boatId, member);
}

// in the test contract, with cal = address(0xCA1)
function test_stewards_lend_unless_paused() public {
    shed.setSteward(cal, true);
    vm.prank(cal);
    shed.lendBoat(3, address(0xD0E));
    assertEq(shed.borrowerOf(3), address(0xD0E), "borrower of boat 3");

    shed.pause();
    vm.prank(cal);
    vm.expectRevert(BoatShed.ShedPaused.selector);
    shed.lendBoat(4, address(0xD0E));

    vm.expectRevert(abi.encodeWithSelector(BoatShed.NotSteward.selector, address(this)));
    shed.lendBoat(4, address(0xD0E));
}
```

```text
[PASS] test_stewards_lend_unless_paused() (gas: 225457)
```

`unpause` mirrors `pause`. The last call fails with `NotSteward` although the shed is paused,
because `onlySteward` is listed first. Pausing is power over users: pause new business, but
think hard before letting a pause block people from taking out their own money.

## Never authorize with tx.origin

`tx.origin` is the account that signed the transaction; `msg.sender` is whoever called this
function directly. They differ as soon as a contract sits in between. If a check reads
`tx.origin == owner`, any contract the owner can be tricked into calling, such as a fake
airdrop, can turn around and call your contract while `tx.origin` is still the owner, and the
check passes. Always use `msg.sender`. Advanced 03 builds this attack.

## Common mistakes

- **Leaving out `_;`.** `Error (2883): Modifier body does not contain '_'.` Put `_;` after the
  checks.
- **Forgetting the modifier.** Without `onlyOwner` on `pause`, a test in which
  `address(0xBAD)` pauses the shed passes: `[PASS] test_anyone_can_pause() (gas: 56164)`. List
  every state-changing function and say who may call it.
- **Emitting after the assignment.** With `owner = msg.sender;` before the `emit`, the event says
  Bea replaced Bea: `[FAIL: OwnershipTransferred param mismatch at previousOwner:
  expected=0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496, got=0x0000000000000000000000000000000000000bEA]`.
  Emit first, or save the old value.
- **Transferring ownership in one step.** A typo locks every `onlyOwner` function for good,
  each call reverting with `NotOwner`. Offer, then accept.
- **Checking `tx.origin`.** Use `msg.sender`.

## Practice

1. Write a modifier with an argument, `onlyBorrower(uint256 boatId)`, that reverts with
   `NotBorrower(boatId, msg.sender)` unless the caller has that boat, and use it on
   `returnBoat(uint256 boatId)`, which clears the borrower.
2. Add `renounceOwnership()` for the owner, which leaves the shed with no owner. What does
   `setHireFee` do afterwards?
3. Test that a steward removed with `setSteward(cal, false)` can no longer lend.
4. Why does the new owner call `acceptOwnership` themselves?

### Answers

```solidity
modifier onlyBorrower(uint256 boatId) {
    if (borrowerOf[boatId] != msg.sender) revert NotBorrower(boatId, msg.sender);
    _;
}

function returnBoat(uint256 boatId) external onlyBorrower(boatId) {
    delete borrowerOf[boatId];
}

function renounceOwnership() external onlyOwner {
    emit OwnershipTransferred(owner, address(0));
    owner = address(0);
    pendingOwner = address(0);
}

// tests, with cal = address(0xCA1) and dee = address(0xD0E)
function test_only_the_borrower_returns() public {
    shed.setSteward(cal, true);
    vm.prank(cal);
    shed.lendBoat(3, dee);

    vm.expectRevert(abi.encodeWithSelector(BoatShed.NotBorrower.selector, 3, cal));
    vm.prank(cal);
    shed.returnBoat(3);

    vm.prank(dee);
    shed.returnBoat(3);
    assertEq(shed.borrowerOf(3), address(0), "borrower after the return");
}

function test_renounce_locks_the_owner_functions() public {
    shed.renounceOwnership();
    vm.expectRevert(abi.encodeWithSelector(BoatShed.NotOwner.selector, address(this)));
    shed.setHireFee(1);
}

function test_removed_steward_cannot_lend() public {
    shed.setSteward(cal, true);
    shed.setSteward(cal, false);
    vm.prank(cal);
    vm.expectRevert(abi.encodeWithSelector(BoatShed.NotSteward.selector, cal));
    shed.lendBoat(3, dee);
}
```

```text
[PASS] test_only_the_borrower_returns() (gas: 166817)
[PASS] test_removed_steward_cannot_lend() (gas: 114567)
[PASS] test_renounce_locks_the_owner_functions() (gas: 59299)
```

After renouncing, `setHireFee` reverts with `NotOwner` for everyone, forever: do it only on
purpose. Accepting from the new account proves that the address is correct and that someone
controls it, which no check on the old owner's side can.

## Key takeaways

- A modifier wraps a function; the body runs at `_;`, and stacked modifiers run left to right.
- `onlyOwner` compares `msg.sender` with a stored owner and reverts with a custom error.
- Hand ownership over in two steps, emit an event for every change of power, and test both the
  allowed and the refused caller.
- Roles are a mapping of permissions; a pause is a flag checked by `whenNotPaused`.
- Never use `tx.origin` for authorization.

## Further reading

- [Solidity documentation: Function Modifiers](https://docs.soliditylang.org/en/latest/contracts.html#function-modifiers)
- [Solidity documentation: Restricting Access](https://docs.soliditylang.org/en/latest/common-patterns.html#restricting-access)
- [Solidity documentation: Security Considerations, tx.origin](https://docs.soliditylang.org/en/latest/security-considerations.html#tx-origin)
