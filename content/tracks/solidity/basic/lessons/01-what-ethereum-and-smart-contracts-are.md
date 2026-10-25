---
title: What Ethereum and Smart Contracts Are
summary: Learn what a blockchain is, how Ethereum works as one shared computer with accounts, transactions, gas and the EVM, why contracts are public and permanent, where they run, where Solidity comes from, and how this course's labs test your code.
minutes: 25
objectives:
  - Explain blocks, hashes and proof of stake, and convert between ether, gwei and wei
  - Tell externally owned accounts from contract accounts, and describe what a transaction contains
  - Work out a transaction's fee from its gas, base fee and priority fee
  - Read a small Solidity contract, say what each line does, and explain why its bugs cost real money
---

## Outline

1. Who this course is for
2. A blockchain in plain words
3. Accounts, ether and wei
4. Transactions and gas
5. The EVM and smart contracts
6. Public, permanent and holding real money
7. Where contracts run and what they are used for
8. Solidity, and why it is still 0.8
9. Reading a first contract
10. How this course and its labs work

## Who this course is for

This course is for people who already program: you know variables, functions, conditions, loops
and objects in some language. If you do not, take Mettle's Python, TypeScript or Go course first.
Programming is explained only where Solidity differs.

## A blockchain in plain words

A **hash** is a fixed-size fingerprint of data: Ethereum's **Keccak-256** turns any input into 32
bytes, and changing one byte of the input changes the hash completely.

A **blockchain** is a chain of **blocks**: each block is a batch of transactions plus the hash of
the block before it. Changing an old block would change its hash and break the link stored in the
next one, so tampering shows. Thousands of **nodes** (computers) keep a copy and check every block.

**Consensus** is how nodes agree on the next block. Since **the Merge** on 15 September 2022,
Ethereum uses **proof of stake**: **validators** lock up at least 32 ether as a deposit, one of them
is chosen at random every 12 seconds (a **slot**) to propose a block, and the others check it and
vote. A validator that cheats loses part of its deposit.

Ethereum's blocks record not only payments but programs and their data, so it works like one
computer that everyone shares and nobody owns. Its **state** (every account's balance, code and
data) changes only through transactions, and every node runs every transaction to the same result.

## Accounts, ether and wei

**Ether** (ETH) is Ethereum's currency. Its smallest unit is the **wei**: 1 ether is 10^18 wei, and
1 **gwei** is 10^9 wei. Contracts count money in whole wei; there are no decimals.

Every **account** has a 20-byte **address**, written as `0x` and 40 hexadecimal digits:

- An **externally owned account** (EOA) belongs to whoever holds its **private key**, which a
  **wallet** app keeps and signs with. Lose the key and the account is lost; leak it and anyone
  can empty it. There is no password reset.
- A **contract account** holds code and its own data, and has no key. It acts only when called.

Both have a balance in wei. (Since 2025, EIP-7702 also lets an EOA delegate to contract code:
Professional 06.)

## Transactions and gas

A **transaction** is a message signed with an EOA's key. It names the recipient, a **value** in
wei, **data** saying which function to call with which arguments, and a **nonce** (the sender's
transaction counter, so it cannot be replayed). A transaction with no recipient deploys a contract.
Transactions wait in a public pool, the **mempool**, until a validator includes them. A
transaction is all or nothing: if it fails, it **reverts**, and every change it made is undone.

Each instruction costs **gas**, a measure of work: a plain ether transfer uses 21,000 gas, and
storing new data costs far more than arithmetic. The sender pays **gas used × (base fee
+ priority fee)**. The **base fee** per gas is set by the protocol, rising when blocks are busier
than a target and falling when they are quieter, and it is burned (destroyed). The **priority fee**
is a tip to the validator. The sender also sets a **gas limit**: a transaction that runs out of gas
reverts, and the whole limit is still paid.

## The EVM and smart contracts

The **EVM** (Ethereum Virtual Machine) is the processor every node simulates. It runs
**bytecode**, works on 256-bit numbers and is deterministic: a contract cannot read a file, open a
website or pick a truly random number, and the only time it knows is the block's.

A **smart contract** is a program at an address: bytecode plus **storage**, the data it keeps
between transactions. **Solidity** is the most used language for writing them.

## Public, permanent and holding real money

- **Public.** All bytecode, storage and transactions can be read by anyone, even variables marked
  `private` (lesson 04 shows how). Never put a secret in a contract.
- **Permanent.** Deployed code cannot be edited. Upgrade patterns exist (Professional 03), but by
  default a bug stays.
- **Money.** Contracts hold other people's funds, anyone may call them, attackers read the code,
  and a mistaken transfer cannot be reversed. So this course teaches security in every lesson.

## Where contracts run and what they are used for

**Mainnet** is the real network; **testnets** such as Sepolia use free test ether, worth nothing.
**Layer 2 rollups** are separate chains that run transactions cheaply and post their data to
Ethereum, which secures them; most Solidity contracts deploy there unchanged. Contracts implement **tokens** (Medium 04), **NFTs** (unique tokens, Medium
05), **DeFi** (lending and exchanges without a bank, Professional 05) and **DAOs** (groups run by
on-chain votes, Professional 07).

## Solidity, and why it is still 0.8

Solidity was proposed by Gavin Wood in 2014 and is developed by the Solidity team at the Ethereum
Foundation. It looks like JavaScript or C, has **contracts** in place of classes, and is
**statically typed**. Before 1.0, a new middle number marks breaking changes: 0.8.0 (December 2020)
made arithmetic overflow an error, and 0.9.0 will remove what 0.8 deprecated, such as `send` and
`transfer`. This course uses 0.8.38, released on 22 October 2026.

## Reading a first contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// A visitor book: anyone can sign it, and everyone can read it.
contract VisitorBook {
    uint256 public visits;
    address public lastVisitor;

    function sign() external {
        visits = visits + 1;
        lastVisitor = msg.sender;
    }
}
```

- The first comment names the licence; `pragma` says which compilers may build the file (0.8.24
  or later, before 0.9).
- `visits` (a 256-bit unsigned number) and `lastVisitor` (an address) are **state variables**:
  they live in storage and survive between transactions. `public` lets anyone read them.
- Any account may call `sign`. `msg.sender` is the address that called it.

Deployed on a local EVM and signed twice, Foundry's gas report shows what `sign` cost:

```text
| Function Name                           | Min             | Avg   | Median | Max   | # Calls |
| sign                                    |           31469 | 48569 |  48569 | 65669 |       2 |
```

The first call wrote two storage values that were still zero, the most expensive kind of write;
the second only changed them, for about half the gas.

## How this course and its labs work

Labs run with **Foundry** on a private EVM: no wallet, no network, no real ether. **Tests** are
small Solidity contracts that deploy yours, call it and check the results:

```solidity
function test_two_visitors() public {
    VisitorBook book = new VisitorBook();
    vm.prank(address(0xA11CE)); // the next call comes from 0xA11CE
    book.sign();
    vm.prank(address(0xB0B));
    book.sign();
    console.log("last visitor:", book.lastVisitor());
    assertEq(book.visits(), 2, "visits after two signatures");
}
```

```text
[PASS] test_two_visitors() (gas: 317893)
Logs:
  last visitor: 0x0000000000000000000000000000000000000B0b
```

**Run** compiles your file and runs the first, **visible** test. A failing check shows its message,
what your code gave and what the test expected, as in this lesson's lab:

```text
[FAIL] test_sells_places_on_the_new_boat(): the number of seats on the new boat: 30 != 40
```

**Submit** also runs hidden tests, which show only the message. You install Foundry in lesson 02.

## Common mistakes

- **Counting in ether instead of wei.** A price stored as `1` is one wei. A test expecting `1`
  for `1 ether` fails with `1000000000000000000 != 1`. Write `1 ether`.
- **Thinking `private` hides data.** Every storage slot can be read from outside. Keep secrets off
  the chain.
- **Expecting a failed transaction to be free.** Its changes are undone; its gas is paid.
- **Planning to fix bugs after deploying.** The code cannot be edited; test before you deploy.

## Practice

1. How many wei are 0.05 ether, and 3 gwei?
2. The first `sign` used 65,669 gas. With a base fee of 10 gwei and a priority fee of 2 gwei, what
   did it cost in wei, and how much was burned?
3. Why can a contract not fetch the weather from a website?

### Answers

A short Foundry script (Medium 12) does the arithmetic with Solidity's unit suffixes:

```solidity
console.log("0.05 ether in wei:", uint256(0.05 ether));
console.log("3 gwei in wei:", uint256(3 gwei));
console.log("fee of 65669 gas at 10 + 2 gwei:", uint256(65_669 * 12 gwei));
console.log("of which burned:", uint256(65_669 * 10 gwei));
```

```text
0.05 ether in wei: 50000000000000000
3 gwei in wei: 3000000000
fee of 65669 gas at 10 + 2 gwei: 788028000000000
of which burned: 656690000000000
```

3. Every node must get the same result, and a website could answer each node differently. Outside
   data arrives only inside transactions (Advanced 06).

## Key takeaways

- Blocks are linked by hashes and agreed on by proof of stake (since 2022).
- 1 ether = 10^18 wei; contracts count in whole wei.
- EOAs have keys and send transactions; contract accounts have code and storage.
- Fee = gas used × (base fee + priority fee); failed transactions still pay.
- On chain, everything is public and code is permanent: test, and think like an attacker.

## Further reading

- [ethereum.org: Ethereum development documentation](https://ethereum.org/en/developers/docs/)
- [Solidity documentation: Introduction to smart contracts](https://docs.soliditylang.org/en/latest/introduction-to-smart-contracts.html)
- [ethereum.org: Gas and fees](https://ethereum.org/en/developers/docs/gas/)
- [ethereum.org: The Merge](https://ethereum.org/en/roadmap/merge/)
