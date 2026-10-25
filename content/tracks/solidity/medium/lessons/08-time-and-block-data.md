---
title: Time and Block Data
summary: Read block.timestamp, block.number, block.chainid, block.basefee and blockhash and know their limits, build deadlines, cooldowns, time locks and vesting that are right at every boundary, understand how far the clock can be trusted and why block data is not randomness, and test time with vm.warp, skip and vm.roll.
minutes: 35
objectives:
  - Read the block's timestamp, number, chain id, base fee and recent hashes, and state what each can and cannot tell you
  - Write deadlines, cooldowns, time locks and linear vesting with clear boundaries and no underflow
  - Explain how block timestamps are set on Ethereum and on rollups, and why block data must never be used as randomness
  - Test time-dependent code at, before and after every boundary with vm.warp, skip and vm.roll
---

## Outline

1. What a contract knows about "now"
2. Deadlines
3. Cooldowns and time locks
4. Vesting: amounts that grow with time
5. How far you can trust the clock
6. Block number, chain id, base fee and block hashes
7. Block data is not randomness
8. Testing time

## What a contract knows about "now"

A contract has no clock of its own. It sees the **block** it runs in: `block.timestamp`, the
block's Unix time in seconds; `block.number`; `block.chainid`; `block.basefee`, the base fee per
gas; and `blockhash(n)`. Every transaction in a block sees the same values. A Foundry test
starts at timestamp 1 and block 1, and cheatcodes move it:

```solidity
function show() internal view {
    console.log("timestamp:", block.timestamp);
    console.log("number:", block.number);
    console.log("chainid:", block.chainid);
    console.log("basefee:", block.basefee);
    console.logBytes32(blockhash(block.number));
}

function test_block_data() public {
    show();
    vm.warp(1_767_225_600); // 2026-01-01 00:00:00 UTC
    vm.roll(24_000_000);
    vm.chainId(1);
    vm.fee(7 gwei);
    show();
}
```

```text
  timestamp: 1
  number: 1
  chainid: 31337
  basefee: 0
  0x0000000000000000000000000000000000000000000000000000000000000000
  timestamp: 1767225600
  number: 24000000
  chainid: 1
  basefee: 7000000000
  0x0000000000000000000000000000000000000000000000000000000000000000
```

31337 is the local chain id of Foundry and anvil; 1 is Ethereum mainnet, 11155111 the Sepolia
testnet. The hash of the current block is always zero: it does not exist yet.

## Deadlines

A **deadline** is an absolute timestamp, computed once and compared with `block.timestamp`.
Decide whether the deadline second itself is still open, write it down, and test both sides:

```solidity
contract SignupSheet {
    uint256 public constant COOLDOWN = 1 days;
    uint256 public immutable closesAt;
    mapping(address => uint256) public lastChange;
    mapping(address => uint256) public seats;

    error Closed(uint256 closedAt);
    error TooSoon(uint256 nextChange);

    constructor(uint256 openFor) {
        closesAt = block.timestamp + openFor;
    }

    function book(uint256 n) external {
        if (block.timestamp >= closesAt) revert Closed(closesAt);
        uint256 last = lastChange[msg.sender];
        if (last != 0 && block.timestamp < last + COOLDOWN) revert TooSoon(last + COOLDOWN);
        lastChange[msg.sender] = block.timestamp;
        seats[msg.sender] = n;
    }
}
```

The tests deploy it at 2026-01-01 with `new SignupSheet(7 days)`, then book at `closesAt - 1`,
at `closesAt`, and twice 23 hours apart (`skip(23 hours)`):

```text
[FAIL: Closed(1767830400 [1.767e9])] test_at_the_deadline() (gas: 35782)
[PASS] test_last_second() (gas: 80284)
[FAIL: TooSoon(1767312000 [1.767e9])] test_two_changes_in_a_day() (gas: 100541)
```

With `>=`, the last second to book is `closesAt - 1`. Forge adds `[1.767e9]` to make big numbers
readable.

## Cooldowns and time locks

A **cooldown** limits how often an address may act: store when it last acted and compare with
that time plus the cooldown. A mapping reads zero for "never", so `last != 0` lets the first
booking through. A **time lock** delays an action after it is announced: `queue()` stores
`readyAt = block.timestamp + DELAY` and `execute()` refuses until `block.timestamp >= readyAt`,
which gives users time to react to, say, a change of rules (Practice 3).

## Vesting: amounts that grow with time

**Vesting** releases an amount gradually: nothing before a **cliff**, then a share proportional to
the time elapsed, then everything.

```solidity
function vestedAt(uint256 t) public view returns (uint256) {
    if (t < start + cliff) return 0; // also covers t < start: no underflow below
    if (t >= start + duration) return total;
    return total * (t - start) / duration; // multiply first, then divide
}
```

With 1,200 ether over 360 days and a 90-day cliff:

```text
  day -1:  0
  day 89:  0
  day 90:  300000000000000000000
  day 180: 600000000000000000000
  day 359: 1196666666666666666666
  day 400: 1200000000000000000000
```

At the cliff a quarter has vested at once; day 359 is rounded down. The order of the checks keeps
`t - start` from underflowing, and dividing last keeps the precision (Advanced 04 covers rounding).

## How far you can trust the clock

On Ethereum since the Merge (2022), time is cut into 12-second **slots**, and the consensus rules
require a block's timestamp to equal the genesis time plus 12 seconds per slot: the proposer
cannot choose it. A slot can stay empty, though, so blocks may be 24 or 36 seconds apart, and a
transaction may wait in the mempool for minutes or hours before a block includes it. Elsewhere
the block producer has more say: before the Merge, miners could shift timestamps by seconds, and
Arbitrum's sequencer may set one up to 24 hours behind or one hour ahead of real time. Solidity's
documentation promises only that a timestamp lies between those of the neighbouring blocks.

So use timestamps for deadlines of minutes, hours and days, never for anything that must be
exact to the second. Keep them in `uint64` or wider: a `uint32` overflows in February 2106.
Solidity 0.8.37 added `block.slotnum` (EIP-7843) for the upcoming Amsterdam EVM; on `osaka` it
does not compile:

```text
Error (1048): "slotnum" is not supported by the VM version.
 --> src/Example.sol:6:16:
  |
6 |         return block.slotnum;
  |                ^^^^^^^^^^^^^
```

## Block number, chain id, base fee and block hashes

- `block.number` counts blocks. Do not turn it into time: block times differ between chains and
  have changed over the years, and on Arbitrum it returns an approximate Ethereum block number.
- `block.chainid` names the chain. Signed messages include it so that they cannot be replayed on
  another chain (Advanced 07).
- `block.basefee` is the current base fee per gas; it is 0 in tests unless you set it with
  `vm.fee`.
- `blockhash(n)` works for the 256 most recent blocks and returns zero for anything else:

```text
  0x0000000000000000000000000000000000000000000000000000000000000000
  0xf0222e4555f079f2fdbf570707db75ee508caa46321baeff622a993218303d10
  0x7468eddb0720a03646876d25045fa535478c57a57b912a197efd90e8d667279c
  0x0000000000000000000000000000000000000000000000000000000000000000
```

That is `vm.roll(1000)`, then the hashes of blocks 1000, 999, 744 (256 back) and 743. Since
Pectra (2025), EIP-2935 also keeps the last 8,191 hashes in a system contract, which
OpenZeppelin's `Blockhash.blockHash` reads.

## Block data is not randomness

`keccak256(abi.encode(block.timestamp, block.prevrandao, msg.sender))` looks random, but any
contract can compute the same value in the same transaction and call your game only when it
would win. `block.prevrandao` (EIP-4399) is the beacon chain's shared randomness; a proposer
knows it before building the block and can bias it by not proposing. Use a commit-reveal scheme
(Advanced 05) or a verifiable random function from an oracle. Advanced 09 shows the attack.

## Testing time

`vm.warp(t)` sets the timestamp; forge-std's `skip(s)` and `rewind(s)` move it. `vm.roll(n)` sets
the block number, separately: warping does not add blocks. `vm.chainId`, `vm.fee`,
`vm.prevrandao` and `vm.setBlockhash` set the rest. Test one second before, at and after every
boundary, and fuzz times with `bound`.

## Common mistakes

- **Off by one at the deadline.** `block.timestamp > closesAt` lets a booking in during the
  closing second. Pick `>=` or `>`, document it, and test `closesAt - 1` and `closesAt`.
- **Subtracting from the clock.** `block.timestamp - 7 days` on a fresh test chain fails with
  `[FAIL: panic: arithmetic underflow or overflow (0x11)]`. Compare by adding:
  `last + 7 days <= block.timestamp`.
- **A cooldown that blocks the first use.** Without `last != 0`, the first booking on a fresh test
  chain fails with `[FAIL: TooSoon(86400 [8.64e4])]`, yet passes on mainnet, where the clock is
  far past one day: tests and production disagree. Treat zero as "never".
- **Counting days in blocks.** `block.number + 7200` is a day only at exactly 12 seconds a block.
  Use `block.timestamp + 1 days`.

## Practice

1. Write `isOpen()` for a sale open from `opensAt` (included) until `closesAt` (excluded).
2. In the vesting example, what is `vestedAt(start + 90 days - 1)`? And `vestedAt(start + 45 days)`?
3. Write a 2-day time lock and a test that `execute()` fails one second early and works on time.

### Answers

```solidity
function isOpen() public view returns (bool) {
    return block.timestamp >= opensAt && block.timestamp < closesAt;
}

contract TimeLock {
    uint256 public constant DELAY = 2 days;
    uint256 public readyAt; // 0: nothing queued

    error NotReady(uint256 readyAt);

    function queue() external {
        readyAt = block.timestamp + DELAY;
    }

    function execute() external {
        if (readyAt == 0 || block.timestamp < readyAt) revert NotReady(readyAt);
        readyAt = 0;
    }
}

function test_time_lock_waits_two_days() public {
    TimeLock lock = new TimeLock();
    lock.queue();
    uint256 ready = block.timestamp + 2 days;
    skip(2 days - 1);
    vm.expectRevert(abi.encodeWithSelector(TimeLock.NotReady.selector, ready));
    lock.execute();
    skip(1);
    lock.execute();
}
```

`test_sale_window` checks `isOpen()` at 999, 1000, 1999 and 2000 for a sale from 1000 to 2000:

```text
[PASS] test_sale_window() (gas: 213764)
[PASS] test_time_lock_waits_two_days() (gas: 284808)
```

2. Both 0: one second before the cliff nothing has vested, whatever the linear formula would
   give (150 ether at day 45).

## Key takeaways

- `block.timestamp` is the block's time, shared by its transactions, 12-second steps on Ethereum.
- Store deadlines as absolute times, decide `>=` or `>`, and test both sides.
- Treat a zero timestamp as "never", and compare by adding, never by subtracting from the clock.
- `blockhash` reaches 256 blocks back; block numbers are not a clock; block data is not random.
- Move time in tests with `vm.warp`, `skip` and `vm.roll`.

## Further reading

- [Solidity documentation: Block and transaction properties](https://docs.soliditylang.org/en/latest/units-and-global-variables.html#block-and-transaction-properties)
- [EIP-4399: Supplant DIFFICULTY opcode with PREVRANDAO](https://eips.ethereum.org/EIPS/eip-4399)
- [EIP-2935: Save historical block hashes in state](https://eips.ethereum.org/EIPS/eip-2935)
- [Arbitrum docs: Block numbers and time](https://docs.arbitrum.io/build-decentralized-apps/arbitrum-vs-ethereum/block-numbers-and-time)
