---
title: Reentrancy
summary: See how an external call lets the callee run your contract again before it has finished, recognise single-function, cross-function and read-only reentrancy and the token hooks that cause them, and prevent all of them with checks-effects-interactions and OpenZeppelin's reentrancy guards, proved by tests with a reentering contract.
minutes: 40
objectives:
  - Explain how an external call or a token hook lets a contract be re-entered mid-function
  - Fix single-function and cross-function reentrancy with checks-effects-interactions
  - Choose between ReentrancyGuard, ReentrancyGuardTransient and nonReentrantView, and apply them to every function that needs them
  - Write a Foundry regression test with a helper contract that re-enters the contract under test
---

## Outline

1. How control leaves your contract
2. Single-function reentrancy and its fix
3. Cross-function reentrancy
4. Read-only reentrancy
5. Reentrancy guards
6. Hooks that call back

## How control leaves your contract

When a contract makes an external call, the EVM starts running the callee's code and only comes
back when the callee returns. Sending ether with `call` runs the recipient's `receive()` or
`fallback()` (Basic 11) with all the remaining gas. If that code calls your contract again, your
function runs a second time *inside* the first one, before the first has finished. That is
**reentrancy**. It is safe only if your state is already correct at the moment of the call; The
DAO (lesson 01) was emptied because it was not.

## Single-function reentrancy and its fix

This vault pays first and clears the balance afterwards:

```solidity
    function withdraw() external {
        uint256 amount = balanceOf[msg.sender];
        if (amount == 0) revert NothingToWithdraw();
        (bool ok,) = msg.sender.call{value: amount}(""); // interaction first...
        if (!ok) revert PaymentFailed();
        balanceOf[msg.sender] = 0; // ...effect last: the bug
    }
```

To prove the bug in a test, the test file declares a helper contract that plays the depositor
and calls `withdraw` again from its `receive()`; the test then asserts the invariant (lesson 01):

```solidity
contract Reenterer {
    PayFirstVault immutable vault;

    constructor(PayFirstVault vault_) {
        vault = vault_;
    }

    function run() external payable {
        vault.deposit{value: msg.value}();
        vault.withdraw();
    }

    receive() external payable {
        if (address(vault).balance >= msg.value) vault.withdraw();
    }
}

contract SingleFunctionTest is Test {
    function test_vault_keeps_alices_deposit() public {
        PayFirstVault vault = new PayFirstVault();
        hoax(makeAddr("alice"), 3 ether);
        vault.deposit{value: 3 ether}();

        Reenterer helper = new Reenterer(vault);
        try helper.run{value: 1 ether}() {} catch {}

        assertEq(address(vault).balance, 3 ether, "alice's ether still in the vault");
        assertLe(address(helper).balance, 1 ether, "ether the reentering depositor holds");
    }
}
```

```text
[FAIL: alice's ether still in the vault: 0 != 3000000000000000000] test_vault_keeps_alices_deposit() (gas: 658963)
```

Every nested `withdraw` read the same uncleared balance, so a 1 ether deposit was paid four times.
The fix is checks-effects-interactions: clear the balance, then pay.

```solidity
        balanceOf[msg.sender] = 0; // effect
        (bool ok,) = msg.sender.call{value: amount}(""); // interaction, last
        if (!ok) revert PaymentFailed();
```

The nested call now finds nothing and reverts, which makes the helper's `receive()` revert, so
the payment fails and the whole withdrawal unwinds (from `forge test -vvvv`):

```text
    │   ├─ [8649] PayFirstVault::withdraw()
    │   │   ├─ [900] Reenterer::receive{value: 1000000000000000000}()
    │   │   │   ├─ [374] PayFirstVault::withdraw()
    │   │   │   │   └─ ← [Revert] NothingToWithdraw()
    │   │   │   └─ ← [Revert] NothingToWithdraw()
    │   │   └─ ← [Revert] PaymentFailed()
```

```text
[PASS] test_vault_keeps_alices_deposit() (gas: 634602)
```

## Cross-function reentrancy

In **cross-function reentrancy** the callee re-enters through a *different* function that uses
the same state. This vault guards `withdrawAll` with `nonReentrant` (below) but still pays
before clearing, and `transfer` is unguarded:

```solidity
    function transfer(address to, uint256 amount) external {
        uint256 available = balanceOf[msg.sender];
        if (amount > available) revert InsufficientBalance(available, amount);
        balanceOf[msg.sender] = available - amount;
        balanceOf[to] += amount;
    }

    function withdrawAll() external nonReentrant {
        uint256 amount = balanceOf[msg.sender];
        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert PaymentFailed();
        balanceOf[msg.sender] = 0;
    }
```

A helper whose `receive()` calls `transfer(friend, msg.value)` is paid *and* hands the same
balance to a friend:

```text
[FAIL: credit the friend received during the withdrawal: 1000000000000000000 != 0] test_a_withdrawal_cannot_also_be_moved() (gas: 853311)
```

The guard did its job: `withdrawAll` was not re-entered. The flaw is the stale balance, which
any function can read. Clearing it before the call fixes both functions at once.

## Read-only reentrancy

A **view** can be re-entered too. This share pool pays a redemption before it lowers
`totalShares`; during the payment its balance has dropped but its share count has not:

```solidity
    function sharePrice() external view returns (uint256) {
        return address(this).balance * 1e18 / totalShares;
    }

    function redeem(uint256 shares) external nonReentrant {
        uint256 amount = shares * address(this).balance / totalShares;
        sharesOf[msg.sender] -= shares;
        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert PaymentFailed();
        totalShares -= shares;
    }
```

```text
[FAIL: the share price read in the middle of a redemption: 750000000000000000 != 1000000000000000000] test_the_price_is_consistent_during_a_redemption() (gas: 952852)
```

The pool loses nothing itself, but a lending contract that values shares with `sharePrice()`
during that window gets a price 25% too low. This is **read-only reentrancy**: the victim is
whoever trusts your view. Moving `totalShares -= shares` before the call makes the test pass.

## Reentrancy guards

A **reentrancy guard** is a lock: OpenZeppelin's `nonReentrant` modifier sets it on entry, clears
it on exit, and reverts with `ReentrancyGuardReentrantCall()` if a guarded function is entered
while it is set. One lock covers every `nonReentrant` function of the contract, so guard all
functions that touch the state a payment depends on; marking only one leaves the cross-function
path open. `nonReentrantView` makes a view revert while the lock is set, so readers like the
lending contract are refused instead of misled.

OpenZeppelin 5.7 has two versions. `ReentrancyGuard` keeps the lock in storage and is marked
deprecated, to be replaced in 6.0; `ReentrancyGuardTransient` keeps it in transient storage
(EIP-1153, Basic 08), which is cheaper. In a gas report of the same guarded function, a call
cost 31,935 to 49,035 gas with the storage guard and 27,237 to 44,337 with the transient one.
Use the transient guard on chains with Cancun support, and treat it as a second line of defence:
CEI comes first.

## Hooks that call back

Reentrancy needs no ether. Token standards with **hooks** call the recipient during a transfer:
ERC-721's `_safeMint` and `safeTransferFrom` call `onERC721Received` (Medium 05), ERC-1155 calls
`onERC1155Received`, and ERC-777 called `tokensToSend` on the sender *before* updating balances
and `tokensReceived` on the recipient. A function that mints with `_safeMint` and records "has
minted" afterwards lets the recipient's hook mint again. OpenZeppelin 5.x no longer ships ERC-777,
but deployed ERC-777 tokens exist, so treat every token transfer as an external call.

## Common mistakes

- **Guarding one function.** `nonReentrant` on `withdrawAll` alone fails with `credit the friend
  received during the withdrawal: 1000000000000000000 != 0`. Apply CEI, and guard every function
  that shares the state.
- **Guarded functions calling each other.** A `nonReentrant` function that calls another one
  reverts with `ReentrancyGuardReentrantCall()`. Put the work in a `private` function.
- **Effects after `_safeMint`.** Writing `minted[msg.sender] = true` after the mint lets a
  receiver hook mint again. Write it before.
- **Counting on `transfer`'s 2300 gas.** It is deprecated (solc 0.8.31 warns), gas costs can
  change, and it breaks smart-contract wallets. Use `call` with CEI.

## Practice

1. Which functions of the cross-function vault need `nonReentrant` for the guard alone to stop
   the attack test? Check it.
2. `addTwice` below reverts. Why, and how do you keep both functions guarded?
3. How do you protect contracts that read `sharePrice()`?

```solidity
contract Till is ReentrancyGuardTransient {
    uint256 public total;

    function add(uint256 amount) public nonReentrant {
        total += amount;
    }

    function addTwice(uint256 amount) external nonReentrant {
        add(amount);
        add(amount);
    }
}
```

### Answers

1. `transfer` as well as `withdrawAll`, since the helper re-enters through `transfer`:

```text
[PASS] test_a_withdrawal_cannot_also_be_moved() (gas: 820653)
```

2. The inner `add` finds the lock set: `[FAIL: ReentrancyGuardReentrantCall()] test_add_twice()
   (gas: 274127)`. Move the work into `_add`:

```solidity
    function add(uint256 amount) external nonReentrant {
        _add(amount);
    }

    function addTwice(uint256 amount) external nonReentrant {
        _add(amount);
        _add(amount);
    }

    function _add(uint256 amount) private {
        total += amount;
    }
```

```text
[PASS] test_add_twice() (gas: 302474)
```

3. Update `totalShares` before paying (CEI), and mark `sharePrice` with `nonReentrantView`.
   Then a read during a redemption reverts, so the test above fails with `PaymentFailed()`
   instead of returning the low price.

## Key takeaways

- Every external call, ether payment or token hook can run your contract again before it ends.
- Finish every state change before the call: checks, effects, interactions.
- Cross-function and read-only reentrancy go through other functions and views of the same state.
- One `nonReentrant` lock covers the guarded functions only; prefer `ReentrancyGuardTransient`.
- Prove each path with a helper contract that re-enters, and assert the invariant.

## Further reading

- [Solidity documentation: Security Considerations, Reentrancy](https://docs.soliditylang.org/en/latest/security-considerations.html#reentrancy)
- [OpenZeppelin Contracts 5.x: Utilities (ReentrancyGuard, ReentrancyGuardTransient)](https://docs.openzeppelin.com/contracts/5.x/api/utils)
- [EIP-1153: Transient storage opcodes](https://eips.ethereum.org/EIPS/eip-1153)
- [ERC-777: Token Standard (its hooks)](https://eips.ethereum.org/EIPS/eip-777)
