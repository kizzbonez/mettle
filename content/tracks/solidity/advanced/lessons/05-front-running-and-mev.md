---
title: Front-Running and MEV
summary: A pending transaction is public before it is mined, so searchers reorder, insert and sandwich transactions to extract value (MEV); defend with slippage limits and deadlines, hide intent behind commit-reveal, and know what private order flow can and cannot do.
minutes: 35
objectives:
  - Explain the public mempool, transaction ordering, and front-running, back-running and sandwich attacks
  - Define MEV and the roles of searchers, builders and proposers in plain words
  - Protect a trade with a slippage limit and a deadline, shown with a test
  - Hide intent with a commit-reveal scheme and explain what private order flow adds
---

## Outline

1. The public mempool and ordering
2. Front-running, back-running and sandwiches
3. MEV in plain words
4. Slippage limits and deadlines
5. Commit-reveal
6. Private order flow

## The public mempool and ordering

When you send a transaction it does not go straight into a block. It waits in the **mempool**, a
public pool of pending transactions that anyone can watch. Whoever builds the next block chooses
which of them to include and **in what order**, usually highest fee first. So two facts an
attacker relies on: your transaction and its calldata are visible before it executes, and someone
else can get a transaction mined just before or just after yours by bidding more.

## Front-running, back-running and sandwiches

**Front-running** is submitting a transaction that executes *before* a target one, copying or
pre-empting it. A one-step prize claim shows it: whoever sends the right phrase first wins.

```solidity
    function claim(string calldata phrase) external {
        if (won) revert AlreadyWon();
        if (keccak256(bytes(phrase)) != answer) revert WrongPhrase();
        won = true;
        (bool ok,) = msg.sender.call{value: address(this).balance}("");
        if (!ok) revert PaymentFailed();
    }
```

A searcher reads the finder's `claim("lantern over the weir")` in the mempool and sends the same
call with a higher fee, so it is mined first:

```text
  searcher balance: 5000000000000000000
  finder balance:   0
```

**Back-running** places a transaction *right after* a target, for example buying straight after a
big trade moved a price. A **sandwich** does both: buy in front of a victim's large buy to push
the price up, let the victim buy at the worse price, then sell behind them. The victim gets poor
execution; the searcher pockets the difference.

## MEV in plain words

**MEV** (maximal extractable value) is the extra value a block's producer can capture by choosing
which transactions to include and how to order them, beyond the normal reward and fees.
**Searchers** scan the mempool for opportunities (arbitrage, liquidations, sandwiches) and bundle
transactions to capture them; **builders** assemble bundles into full blocks; **proposers** (the
validators) pick a block to propose. Not all MEV is theft, arbitrage that aligns prices across
venues is useful, but front-running and sandwiching are a tax on ordinary users, and your
contract should not make them easy.

## Slippage limits and deadlines

A trade that accepts whatever price it finds when it executes invites a sandwich. The fix is a
**slippage limit**: the caller states the worst result they will accept, and the trade reverts
below it. Add a **deadline** so a transaction stuck in the mempool cannot be executed much later at
a stale price.

```solidity
    function swap(uint256 amountIn, uint256 minOut, uint256 deadline) external view returns (uint256 out) {
        require(block.timestamp <= deadline, "expired");
        out = amountIn * rate;
        if (out < minOut) revert TooLittleOut(out, minOut);
    }
```

If a sandwich moves the rate down before the swap runs, the output falls below `minOut` and the
call reverts instead of filling at the bad price:

```text
[PASS] test_slippage_limit_reverts()
```

with the revert `TooLittleOut(60000, 95000)`. The caller sets `minOut` from a recent quote and a
tolerance (say 0.5%); too loose and the sandwich still profits, too tight and honest price moves
cause failed transactions. The contract's job is to enforce the limit, never to pick it.

## Commit-reveal

When the value itself must stay hidden until a deadline, a sealed bid, a chosen move, a secret
phrase, use **commit-reveal**. First send `commit(hash)` where the hash is
`keccak256(abi.encode(value, salt, msg.sender))`: it reveals nothing and binds the value to you.
Later send `reveal(value, salt)`, which the contract checks against your commitment. Two rules
make it sound: bind `msg.sender` into the hash so nobody can open your commitment, and require a
**delay** between commit and reveal so a searcher who learns the value at reveal time cannot both
commit and reveal in the same block ahead of you.

```solidity
    function reveal(bytes32 phrase, bytes32 salt) external {
        if (won) revert AlreadyWon();
        bytes32 c = keccak256(abi.encode(phrase, salt, msg.sender));
        if (!committed[c]) revert NoCommitment();
        if (block.number < committedAt[c] + REVEAL_DELAY) revert RevealTooEarly(block.number, committedAt[c] + REVEAL_DELAY);
        if (keccak256(abi.encode(phrase)) != answer) revert WrongPhrase();
        won = true;
        (bool ok,) = msg.sender.call{value: address(this).balance}("");
        if (!ok) revert PaymentFailed();
    }
```

A test commits for the finder at block 100, then lets a searcher commit and try to reveal in
block 101:

```text
  searcher reveal reverted; selector matches RevealTooEarly: true
  searcher balance: 0
  finder balance:   5000000000000000000
```

The searcher's reveal is in the same block as their commit, so the delay check stops it; the
finder, who committed a block earlier, wins.

## Private order flow

Another approach is to keep the transaction out of the public mempool. **Private order flow**
sends it straight to a builder through a service such as Flashbots Protect, which bundles it
privately and includes it only if it would not revert, so sandwich bots never see it in advance
and a failed transaction costs no gas. This helps the sender, but it moves trust to the builder
and does not make your contract safe on its own: a careless user, a different RPC, or a builder
that leaks still exposes the transaction. Design the contract so that even a fully public
transaction is safe (slippage limits, deadlines, commit-reveal), and treat private order flow as
an extra, not a substitute.

## Common mistakes

- **No slippage limit.** A swap with no `minOut` fills at whatever price a sandwich leaves. Always
  take a caller-chosen minimum (or maximum input) and revert past it.
- **No deadline.** A transaction mined hours later executes at a stale price. Take a `deadline`
  and check `block.timestamp`.
- **A commitment with no delay.** If a reveal can land in the same block as its commit, a searcher
  who sees the value commits and reveals it first. Require blocks to pass.
- **A commitment not bound to the sender.** `keccak256(abi.encode(value, salt))` can be opened by
  anyone who sees the reveal. Include `msg.sender`.
- **Trusting `block.timestamp` as a secret or a lottery seed.** Proposers choose it within limits;
  on-chain "randomness" from block data is predictable (lesson 09). Use commit-reveal or an
  external randomness source.

## Practice

1. Add a slippage limit and a deadline to `buy(uint256 amountIn)` that returns `amountIn * rate`.
2. Why does binding `msg.sender` into a commitment matter, on top of the delay?
3. A sealed-bid auction stores each bid in the clear in a `mapping` until the reveal. What is
   wrong, and what do you store instead?

### Answers

1. `function buy(uint256 amountIn, uint256 minOut, uint256 deadline) external { require(block.timestamp <= deadline, "expired"); uint256 out = amountIn * rate; if (out < minOut) revert TooLittleOut(out, minOut); ... }`.
2. The delay stops a same-block commit-and-reveal, but if the hash has no sender a searcher can
   wait out the delay and then reveal *your* committed value as their own. Binding `msg.sender`
   means only you can open your commitment.
3. Storage is public (lesson 03), so every bid is readable before the reveal and can be
   front-run. Store `keccak256(abi.encode(bid, salt, msg.sender))` and reveal the bid later.

## Key takeaways

- The mempool is public and ordering is for sale, so assume every pending call is seen and can be
  raced.
- Front-running, back-running and sandwiching extract MEV at ordinary users' expense.
- Protect trades with a caller-chosen slippage limit and a deadline, enforced by the contract.
- Hide intent with commit-reveal: bind `msg.sender` and require a delay between commit and reveal.
- Private order flow helps but is not a substitute for a contract that is safe in the open.

## Further reading

- [ethereum.org: Maximal extractable value (MEV)](https://ethereum.org/en/developers/docs/mev/)
- [Flashbots Protect: overview](https://docs.flashbots.net/flashbots-protect/overview)
- [Solidity by Example: Front Running](https://solidity-by-example.org/hacks/front-running/)
