---
title: The EVM Roadmap and Staying Current
summary: Learn how Ethereum changes through EIPs, hard forks and client releases, what Dencun, Pectra and Fusaka changed for contract developers, what the upcoming Glamsterdam upgrade proposes, how Solidity is preparing for 0.9, and how to read an EIP and a release note so your contracts keep working.
minutes: 35
objectives:
  - Explain how an EIP becomes part of a hard fork, and match forks to solc's evm_version names
  - List what Dencun, Pectra and Fusaka changed for contracts, and what Glamsterdam proposes
  - Remove the features Solidity deprecated ahead of 0.9 from a contract
  - Read an EIP's specification and security sections and a compiler release note, and plan an upgrade
---

## Outline

1. How Ethereum upgrades
2. What recent forks changed for contracts
3. Glamsterdam: the next upgrade
4. Solidity's road to 0.9
5. Reading an EIP and a release note

## How Ethereum upgrades

Changes to Ethereum start as an **EIP** (Ethereum Improvement Proposal): a document with a
specification that moves through statuses such as Draft, Review, Last Call (a final review window)
and Final. Core EIPs change the protocol; ERCs, such as ERC-20 or ERC-4337, are application
standards that need no fork.

Client developers choose which core EIPs go into the next **hard fork**, discuss them on public
calls (All Core Devs), and list them in a **meta EIP**: EIP-7600 for Pectra, EIP-7607 for Fusaka,
EIP-7773 for Glamsterdam. Every client team ships a release with the change, the fork activates on
testnets (Sepolia, Hoodi) and finally on mainnet at a set time. A fork's name joins its
execution-layer half, which is what solc's `evm_version` follows, and its consensus-layer half:
Dencun is Deneb plus `cancun`, Pectra is Prague plus Electra, Fusaka is Fulu plus `osaka`,
Glamsterdam is Gloas plus `amsterdam`.

The compiler checks the target. The `clz` opcode arrived with Osaka:

```text
Error (4948): The "clz" instruction is only available for Osaka-compatible VMs (you are currently compiling for "prague").
 --> src/Example.sol:7:18:
  |
7 |             n := clz(x)
  |                  ^^^
```

Other differences, such as `PUSH0` on an old chain, only show at run time (lesson 09).

## What recent forks changed for contracts

| Fork (`evm_version`) | Mainnet | What it changed for contracts |
| --- | --- | --- |
| Dencun (`cancun`) | March 2024 | Transient storage `TLOAD`/`TSTORE` (EIP-1153), `MCOPY` (EIP-5656), blobs with `BLOBHASH` (EIP-4844), `SELFDESTRUCT` deletes only contracts created in the same transaction (EIP-6780) |
| Pectra (`prague`) | 7 May 2025 | EOAs delegate to code (EIP-7702), BLS12-381 precompiles (EIP-2537), recent block hashes kept in state (EIP-2935), dearer calldata for data-heavy transactions (EIP-7623) |
| Fusaka (`osaka`) | 3 December 2025 | `CLZ` (EIP-7939), a P-256 signature precompile for passkeys (EIP-7951), a cap of 2^24 = 16,777,216 gas per transaction (EIP-7825), MODEXP limits and repricing (EIP-7823, EIP-7883), PeerDAS for blobs (EIP-7594) |

Forks also change prices, and prices are not part of your code's contract with the chain. In 2019
Istanbul's EIP-1884 raised `SLOAD` from 200 to 800 gas, and fallback functions that had fitted in
the 2,300 gas `transfer` forwards stopped working. That is why `transfer` is deprecated: no fixed
stipend is safe, and 2,300 is too little for any `receive` that writes to storage, such as a
smart wallet's:

```solidity
contract CountingWallet {
    uint256 public received;

    receive() external payable {
        received += msg.value;
    }
}
// Payer.payWithTransfer: to.transfer(1 wei);
// Payer.payWithCall:     (ok,) = to.call{value: 1 wei}("");
```

```text
  transfer: reverted
  call: paid true
  wallet counted: 1
```

## Glamsterdam: the next upgrade

Glamsterdam (`amsterdam`) is upcoming. As of late October 2026 it is live on the Sepolia testnet (since 6 October). Its
Hoodi testnet date, 26 October, was postponed on 22 October so that developers could study how one
of its EIPs affects deployed contracts, and no mainnet date is set. EIP-7773 lists 18 EIPs scheduled
for inclusion, still open to change. The headliners, enshrined proposer-builder separation
(EIP-7732) and block-level access lists (EIP-7928), mostly concern clients and block builders. For
contracts:

- **Gas repricing.** EIP-8037 would price state creation per byte: a new storage slot would cost
  97,920 gas instead of 20,000, a new account 183,600 instead of 25,000. EIP-8038 reprices state
  access. This is the EIP behind the Hoodi delay: security researchers found deployed contracts
  whose failure handling depends on how much gas a call needs. Never hard-code gas amounts.
- **EIP-7954** would raise the contract size limit from 24 KiB to 64 KiB.
- **EIP-7843** adds a `SLOTNUM` opcode (Solidity 0.8.37's `block.slotnum`), **EIP-7708** makes ether
  transfers emit an ERC-20-style `Transfer` log, **EIP-7997** requires the CREATE2 factory at
  `0x4e59b44847b379578588920cA78FbF26c0B4956C` that Foundry uses (lesson 09), and **EIP-8024** adds
  `DUPN`, `SWAPN` and `EXCHANGE`, deeper stack access for compilers.

solc 0.8.38 supports the target but marks it experimental:

```text
Error: EVM version 'amsterdam' is experimental and can only be used with the 'settings.experimental' option enabled.
```

With the default `osaka`, `block.slotnum` fails with `Error (1048): "slotnum" is not supported by
the VM version.` Do not ship code for a fork that has not reached mainnet.

## Solidity's road to 0.9

Solidity is still 0.8.x because 0.9 will remove features, and a breaking release needs warning
first. Since 0.8.31 the compiler warns about each feature to be removed:

```solidity
pragma abicoder v1;

abstract contract Guarded {
    modifier onlyKeeper() virtual;
}

contract Refunds is Guarded {
    address payable public keeper;
    Refunds public previous;

    modifier onlyKeeper() override {
        require(msg.sender == keeper, "not keeper");
        _;
    }

    function refund(address payable to, uint256 amount) external onlyKeeper {
        to.transfer(amount);
    }

    function isSuccessor(Refunds other) external view returns (bool) {
        return other == previous;
    }
}
```

```text
Warning (9511): ABI coder v1 is deprecated and scheduled for removal. Use ABI coder v2 instead.
Warning (8429): Virtual modifiers are deprecated and scheduled for removal.
Warning (9207): 'transfer' is deprecated and scheduled for removal. Use 'call{value: <amount>}("")' instead.
Warning (9170): Comparison of variables of contract type is deprecated and scheduled for removal. Use an explicit cast to address type and compare the addresses instead.
```

(Each warning also prints its source location.) `send` and the `/// @solidity memory-safe-assembly`
comment are deprecated too. Since 0.8.35 the compiler also warns that `at`, `layout` and `transient`
will become keywords; OpenZeppelin 5.7's `Checkpoints` library triggers `"at" will be promoted to
keyword in the future`. Treat warnings as work to do, and pin the compiler version you tested with.

## Reading an EIP and a release note

For a contract developer, three parts of an EIP matter most: the **Specification** (exactly what
changes), **Backwards Compatibility** (what may break) and **Security Considerations** (what
attackers gain; EIP-7702's warned about `tx.origin` checks a year before Pectra went live). Check
the status: anything before Final can still change.

Solidity's changelog lists each release's Important Bugfixes, Language Features, Compiler Features
and Bugfixes, and the docs keep a list of known bugs with the versions they affect: 0.8.32 and
0.8.34 fixed storage bugs. Before you move to a new compiler, OpenZeppelin release or fork:

1. Read the release notes and the meta EIP; search your code for every affected feature.
2. Change versions on a branch; rebuild with warnings visible.
3. Run the tests, compare `forge snapshot --diff`, and diff `forge inspect <Contract> storageLayout`
   for upgradeable contracts.
4. Test on the upgraded testnet before mainnet.

Follow the sources, not summaries: blog.ethereum.org, eips.ethereum.org, the Solidity blog and
changelog, Foundry and OpenZeppelin releases.

## Common mistakes

- **Hard-coded gas.** A 2,300 stipend or a fixed `gas:` limit broke with EIP-1884 and may break
  again with EIP-8037. Forward all gas and limit reentrancy with locks.
- **The newest target for an older chain.** Compile for the oldest fork among your chains.
- **Ignoring deprecation warnings.** They become errors in 0.9.
- **Treating a testnet fork as final.** Glamsterdam's EIPs are still in Last Call and Review.

## Practice

1. Remove the four deprecated features from `Refunds`.
2. Which `evm_version` does `clz` need, and which fork brought it?
3. EIP-7954 is in Last Call. Can you rely on 64 KiB contracts yet?

### Answers

```solidity
abstract contract Guarded {
    function _checkKeeper() internal view virtual;

    modifier onlyKeeper() {
        _checkKeeper();
        _;
    }
}

contract Refunds is Guarded {
    address payable public keeper;
    Refunds public previous;

    error NotKeeper(address caller);
    error PaymentFailed();

    function _checkKeeper() internal view override {
        if (msg.sender != keeper) revert NotKeeper(msg.sender);
    }

    function refund(address payable to, uint256 amount) external onlyKeeper {
        (bool ok,) = to.call{value: amount}("");
        if (!ok) revert PaymentFailed();
    }

    function isSuccessor(Refunds other) external view returns (bool) {
        return address(other) == address(previous);
    }
}
```

```text
Compiler run successful!
```

The default ABI coder v2 needs no pragma, and an overridable internal function replaces the virtual
modifier.

2. `osaka`, from Fusaka (3 December 2025).
3. No: Last Call is the final review, but the EIP can still change, and it applies only from
   Glamsterdam's mainnet activation, which has no date.

## Key takeaways

- EIPs become forks through meta EIPs, client releases, testnets and then mainnet.
- Cancun, Prague and Osaka added transient storage, EIP-7702 and `CLZ`; set `evm_version` to match
  your chains.
- Glamsterdam is upcoming, with no mainnet date; its repricing is a reason never to hard-code gas.
- Remove deprecated features now, pin versions, and upgrade by reading notes, testing and diffing.

## Further reading

- [EIP-7773: Hardfork Meta - Glamsterdam](https://eips.ethereum.org/EIPS/eip-7773)
- [EIP-1: EIP Purpose and Guidelines](https://eips.ethereum.org/EIPS/eip-1)
- [Solidity changelog](https://github.com/ethereum/solidity/blob/develop/Changelog.md)
- [Ethereum Foundation blog: Glamsterdam Hoodi announcement](https://blog.ethereum.org/2026/10/16/glamsterdam-hoodi-announcement)
