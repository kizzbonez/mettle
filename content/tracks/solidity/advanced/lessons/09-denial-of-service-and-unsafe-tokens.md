---
title: Denial of Service and Unsafe Tokens
summary: Keep a contract usable when someone wants it stuck. Avoid loops that outgrow a transaction, push payments that one recipient can block, balances that forced ether breaks and block data used as randomness, and handle ERC-20 tokens that return nothing, charge fees or change balances on their own.
minutes: 35
objectives:
  - Measure a loop's gas in a test and explain why it can exceed the 16,777,216 gas a transaction may use
  - Replace push payments with pull payments so a reverting recipient cannot block everyone
  - Explain why address(this).balance and block data must not decide outcomes, and show both attacks in tests
  - Use SafeERC20 and balance-before-and-after accounting for tokens with missing return values and transfer fees
---

## Outline

1. Loops that outgrow a transaction
2. One recipient that blocks everyone
3. Forced ether
4. Randomness from block data
5. Unusual ERC-20 tokens

## Loops that outgrow a transaction

A **denial of service** (DoS) does not steal funds; it makes a contract unusable, and the funds
in it are often stuck for good. It is SC10 in the OWASP Smart Contract Top 10 (2025).

Every transaction has a gas limit. Blocks hold up to 60 million gas since late 2025, and since
the Fusaka upgrade (3 December 2025) **EIP-7825** caps a single transaction at **16,777,216
gas** (2^24), whatever the block limit. A loop over a list that keeps growing will cross that
line one day:

```solidity
function join() external {
    members.push(msg.sender);
}

function distribute() external payable {
    uint256 share = msg.value / members.length;
    for (uint256 i = 0; i < members.length; i++) {
        credit[members[i]] += share;
    }
}
```

```text
[PASS] test_100() (gas: 7524574)
Logs:
  gas for 100 2511068

[PASS] test_1000() (gas: 74701476)
Logs:
  gas for 1000 24897668
```

The test reads each call's gas with `vm.lastCallGas()`. A thousand members need 24,897,668 gas;
forge's test EVM does not apply the cap, so the test passes, but on Ethereum that transaction is
invalid and the pot can never be shared again. Worse, `join` is free, so an attacker can
**grief** the contract (hurt it at little cost to themselves) by adding dust entries until it
stops. Bound every loop: cap the list, let callers process it in pages, or, best, do the work
per user when that user acts.

## One recipient that blocks everyone

```solidity
function bid() external payable {
    if (msg.value <= highest) revert BidTooLow(highest);
    (address previous, uint256 refund) = (leader, highest);
    (leader, highest) = (msg.sender, msg.value);
    if (previous != address(0)) {
        (bool ok,) = previous.call{value: refund}("");
        if (!ok) revert RefundFailed();
    }
}
```

A `Blocker` contract with no `receive` or `fallback` bids 1 ether; then Alice bids 2 ether:

```text
[FAIL: RefundFailed()] test_a_bidder_that_refuses_refunds() (gas: 571881)
```

Every later bid tries to refund the blocker first and reverts, so the blocker wins with the
lowest bid. Ignoring `ok` instead would keep the blocker's ether in the contract with no way
out. The fix is the **pull payment** pattern from Medium 10: record what each address is owed
and let it withdraw. A token that blocklists addresses causes the same DoS for push payments
of tokens.

## Forced ether

A contract cannot refuse all incoming ether. `selfdestruct` still sends a contract's balance to
any address without calling it (EIP-6780 only stopped it deleting code), validator withdrawals
credit addresses without running code, and ether can be sent to an address before a contract is
deployed there:

```solidity
// the seventh 1-ether deposit wins the pot
if (address(this).balance == 7 ether) {
    (bool ok,) = msg.sender.call{value: 7 ether}("");
    if (!ok) revert PaymentFailed();
}

contract ForceSend {
    constructor(address payable target) payable {
        selfdestruct(target);
    }
}
```

The test forces in 0.5 ether, then seven players deposit:

```text
Warning (5159): "selfdestruct" has been deprecated. Note that, starting from the Cancun hard fork, the underlying opcode no longer deletes the code and data associated with an account and only transfers its Ether to the beneficiary, unless executed in the same transaction in which the contract was created (see EIP-6780). Any use in newly deployed contracts is strongly discouraged even if the new behavior is taken into account. Future changes to the EVM might further reduce the functionality of the opcode.
Logs:
  pot after seven deposits 7500000000000000000
```

The balance went from 6.5 to 7.5 ether and was never exactly 7, so nobody can ever win.
`address(this).balance` can only grow behind your back: count what you received in your own
state variable, and never test the balance for equality.

## Randomness from block data

Since the Merge, `block.prevrandao` carries the beacon chain's random value, but everything in a
block is known to every contract in that block, and the validator who proposes it knows it in
advance. A coin flip that hashes `block.prevrandao` and `block.timestamp` loses to a contract
that hashes the same values first and plays only when it would win:

```solidity
function tryPlay(CoinFlip game) external {
    if (uint256(keccak256(abi.encode(block.prevrandao, block.timestamp))) % 2 == 0) {
        plays++;
        game.play{value: 0.1 ether}();
    }
}
```

```text
Logs:
  plays 7 attacker balance 1700000000000000000
```

Over 20 blocks (`vm.roll`, `vm.warp`, `vm.prevrandao`) it played 7 times and won every time.
Use a commit-reveal scheme (Advanced 05) or a verifiable random function (VRF) from an oracle,
which delivers a random number with a proof in a later transaction.

## Unusual ERC-20 tokens

Medium 04's ERC-20 returns `true` from `transfer`, but real tokens vary. USDT on Ethereum returns
nothing; some tokens return `false` instead of reverting; some keep a **fee on transfer**;
**rebasing** tokens change balances without transfers; USDC and USDT can **blocklist**
addresses and pause. OpenZeppelin's **`SafeERC20`** handles the first two: `safeTransfer`
accepts no return data and reverts on `false`. For fees, credit what actually arrived:

```solidity
function deposit(uint256 amount) external {
    uint256 before = token.balanceOf(address(this));
    token.safeTransferFrom(msg.sender, address(this), amount);
    credit[msg.sender] += token.balanceOf(address(this)) - before;
}
```

```text
[PASS] test_fee_on_transfer() (gas: 1645404)
Logs:
  asked 100e18, credited 98000000000000000000
[FAIL: EvmError: Revert] test_no_return_value() (gas: 377251)
Logs:
  safeTransfer moved 1000000000000000000
```

The second test's `safeTransfer` worked; its plain `IERC20.transfer` reverted while decoding the
missing `bool`. Rebasing tokens break any stored balance; often the safest choice is to accept
only tokens you have reviewed.

## Common mistakes

- **A loop over a list anyone can grow.** 1,000 members cost 24,897,668 gas, over the
  16,777,216 cap. Do the work per user or in pages.
- **Reverting the whole call when one payment fails.** One refusing bidder made every bid
  revert with `RefundFailed()`. Use pull payments.
- **`address(this).balance == x`.** Forced ether made the pot 7.5 ether. Track deposits in
  state.
- **Plain `transfer` on unknown tokens.** A token without a return value makes it revert with
  `EvmError: Revert`. Use `safeTransfer`, and measure balances for fee-charging tokens.

## Practice

1. Rewrite the auction so that refunds are pulled, and show that the blocker no longer blocks.
2. Fix the seventh-deposit game so forced ether cannot break it.
3. A rewards contract pays every staker in a loop each week. Name two ways to make it safe.

### Answers

```solidity
function bid() external payable {
    if (msg.value <= highest) revert BidTooLow(highest);
    pendingReturns[leader] += highest;
    (leader, highest) = (msg.sender, msg.value);
}

function withdrawRefund() external {
    uint256 amount = pendingReturns[msg.sender];
    pendingReturns[msg.sender] = 0;
    (bool ok,) = msg.sender.call{value: amount}("");
    if (!ok) revert RefundFailed();
}

// 2. in the game: count deposits instead of reading the balance
deposits++;
if (deposits == 7) {
    deposits = 0;
    (bool ok,) = msg.sender.call{value: 7 ether}("");
    if (!ok) revert PaymentFailed();
}
```

```text
[PASS] test_1_pull_refunds() (gas: 703240)
Logs:
  leader is alice true
  refund waiting for the blocker 1000000000000000000

[PASS] test_2_counted_deposits() (gas: 601441)
Logs:
  seventh player's balance 7000000000000000000
  left in the game 500000000000000000
```

3: let each staker claim their own rewards, computed from a per-share accumulator when they
act, or process stakers in fixed-size pages across several transactions.

## Key takeaways

- A transaction may use at most 16,777,216 gas since Fusaka: never loop over a list users can grow.
- Pull payments keep one failing recipient from blocking everyone.
- Ether can be forced into any contract: never treat `address(this).balance` as an invariant.
- Block data is public to every contract in the block: it is not randomness.
- Use `SafeERC20`, measure what arrived, and review a token's behaviour before accepting it.

## Further reading

- [EIP-7825: Transaction Gas Limit Cap](https://eips.ethereum.org/EIPS/eip-7825)
- [Solidity documentation: Security Considerations](https://docs.soliditylang.org/en/latest/security-considerations.html)
- [OpenZeppelin Contracts: SafeERC20](https://docs.openzeppelin.com/contracts/5.x/api/token/erc20#SafeERC20)
- [Weird ERC20 Tokens (d-xo)](https://github.com/d-xo/weird-erc20)
