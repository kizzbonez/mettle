---
title: Access Control Flaws
summary: Find the ways a contract lets the wrong caller in, from a missing or misplaced modifier and an initializer anyone can call to tx.origin authorisation, data that is public because nothing on a chain is secret, a misconfigured role, and selfdestruct after EIP-6780, each shown with an attack test.
minutes: 40
objectives:
  - Spot a privileged function with a missing or wrong access-control check and add the right one
  - Protect an initializer so it can run once, and explain the Parity freeze it prevents
  - Show with a test why tx.origin authorisation is phishable and msg.sender is not
  - Explain that on-chain data is never secret, configure an AccessControl role admin, and describe selfdestruct after EIP-6780
---

## Outline

1. Missing and wrong modifiers
2. Unprotected initializers
3. tx.origin phishing
4. Nothing on a chain is secret
5. Role misconfiguration
6. selfdestruct after EIP-6780

**Access control** decides which caller may run which function. It is the most common source of
real losses (OWASP SC01, lesson 01). The bugs are small and each has a one-line fix; the work is
finding the function with no check, or the wrong one.

## Missing and wrong modifiers

Every `external`/`public` function is callable by anyone. A privileged one needs a check, in a
**modifier** (Basic 10) so it reads the same everywhere. The frequent bug is simply forgetting it
on one function. Here `spend` is guarded but `addKeeper` is not, so anyone can appoint a keeper:

```solidity
    function addKeeper(address keeper) external { // missing onlyWarden
        isKeeper[keeper] = true;
    }

    function spend(address to, uint256 amount) external onlyWarden {
        (bool ok,) = to.call{value: amount}("");
        require(ok);
    }
```

List every function that changes state or moves value, and name who may call each. A visibility
error from the compiler is a gift compared with a silent gap: a function with no visibility no
longer compiles at all since 0.8.

```text
Error (4937): No visibility specified. Did you intend to add "public"?
 --> src/Example.sol:7:5:
  |
7 |     function _payPrize(address winner) {
```

## Unprotected initializers

A contract that cannot run its constructor (a proxy's implementation, lesson 08) uses an
`initialise` function instead. If it is not guarded, anyone can call it and become the owner:

```solidity
contract ClubVault {
    address public owner;

    function initialize(address owner_) external {
        owner = owner_;
    }
}
```

```text
[FAIL: the owner after a second initialize: 0x2385…f424 != 0xa272…9C92] test_nobody_can_initialize_twice() (gas: 270434)
```

The second caller overwrote the owner. Guard it with a flag so it runs once:

```solidity
    bool private initialized;

    error AlreadyInitialized();

    function initialize(address owner_) external {
        if (initialized) revert AlreadyInitialized();
        initialized = true;
        owner = owner_;
    }
```

```text
[PASS] test_nobody_can_initialize_twice() (gas: 287532)
```

This is exactly the **Parity** freeze (lesson 01): a wallet library whose `initWallet` nobody had
called was initialised by a passer-by, who then ran its `kill`. OpenZeppelin's `Initializable`
and its `initializer` modifier package this pattern; lesson 08 uses it.

## tx.origin phishing

**`tx.origin`** is the external account that started the transaction; **`msg.sender`** is the
immediate caller. They are equal only when an account calls your contract directly. Authorising
with `tx.origin` means any contract the owner is persuaded to call can act as the owner. This
wallet pays only if `tx.origin` is the owner:

```solidity
    function pay(address to, uint256 amount) external {
        if (tx.origin != owner) revert NotOwner(msg.sender);
        (bool ok,) = to.call{value: amount}("");
        if (!ok) revert PaymentFailed();
    }
```

A test deploys a `FreeBadge` contract and has the owner call it (`vm.prank(owner, owner)` sets
both `msg.sender` and `tx.origin`); its `claim()` calls `wallet.pay(collector, balance)`. Inside
`pay`, `tx.origin` is still the owner, so the check passes:

```text
[FAIL: the wallet's ether after the owner called another contract: 0 != 2000000000000000000] test_a_contract_the_owner_calls_cannot_spend() (gas: 533913)
```

Check `msg.sender` instead. Now the caller is the `FreeBadge` contract, not the owner, and the
payment reverts with `NotOwner(0x2e23…470b)`:

```text
[PASS] test_a_contract_the_owner_calls_cannot_spend() (gas: 498618)
```

Never use `tx.origin` for authorisation. A smart-contract wallet or an EIP-7702 account
(Professional 06) is a contract, so a `tx.origin == msg.sender` check that tries to "only allow
people" locks those users out while stopping nothing worth stopping.

## Nothing on a chain is secret

`private` and `internal` control which *contracts* may read a variable in Solidity; they do not
hide the value. Every storage slot is public on the chain, readable with an RPC call or, in a
test, with `vm.load`. So a `private` password, a seed for "randomness" (lesson 09) or a sealed
bid stored in the clear can all be read before they are used. Keep secrets off chain; store only
a hash, or use commit-reveal (lesson 05). `private` is an encapsulation tool, not a vault.

## Role misconfiguration

Bigger systems replace one owner with roles: OpenZeppelin's **`AccessControl`** gives each role
an **admin role** whose holders grant and revoke it (`DEFAULT_ADMIN_ROLE` is the admin of every
role until you change it). The trap is making a role its own admin, so its holders can appoint
each other without the owner:

```solidity
    constructor(address admin, address minter) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, minter);
        _setRoleAdmin(MINTER_ROLE, MINTER_ROLE); // the misconfiguration
    }
```

```text
[FAIL: a minter appointed another minter] test_only_the_admin_appoints_minters() (gas: 717699)
```

Drop that line and `MINTER_ROLE` keeps `DEFAULT_ADMIN_ROLE` as its admin. A minter's
`grantRole` then reverts with `AccessControlUnauthorizedAccount(0x030f…1B59, 0x0000…0000)`, naming
the account and the admin role it lacks. Give each role the least power it needs (lesson 01), and
test who can grant each one.

## selfdestruct after EIP-6780

`selfdestruct(recipient)` once deleted a contract's code and storage and sent its ether away.
Since the **Cancun** fork (**EIP-6780**, 2024) it only deletes when it runs *in the same
transaction that created the contract*; otherwise it just transfers the ether and the code stays.
The compiler warns on every use:

```text
Warning (5159): "selfdestruct" has been deprecated. Note that, starting from the Cancun hard fork, the underlying opcode no longer deletes the code and data associated with an account and only transfers its Ether to the beneficiary, unless executed in the same transaction in which the contract was created (see EIP-6780).
```

A test that funds an already-deployed contract, then calls its `selfdestruct`, confirms the ether
leaves but the code remains:

```text
old contract: code bytes 256 ether 0
```

So `selfdestruct` is deprecated (strongly discouraged for new contracts). Two lessons for access
control: never make `selfdestruct` reachable without a tight check (the November Parity freeze was
an unprotected `kill`), and never assume a contract can be made to disappear; its code and storage
outlive the call.

## Common mistakes

- **One unguarded setter.** A `setOwner`, `setFee` or `withdraw` with no modifier is the whole
  attack. Check every state-changing function's caller.
- **Guarding the wrong function.** A `private _spend` with the check, called by a `public spend`
  without it, is unprotected. Put the check on the entry point.
- **`require(tx.origin == msg.sender)`.** Meant to block contracts, it blocks smart-contract and
  EIP-7702 wallets and stops no real attacker. Remove it.
- **Trusting `private`.** A `private` key or seed is readable with `vm.load` or an RPC call. Store
  a hash, not the secret.
- **A role as its own admin.** `_setRoleAdmin(ROLE, ROLE)` lets holders appoint each other. Leave
  the admin as `DEFAULT_ADMIN_ROLE` unless you mean otherwise.

## Practice

1. Add the right check to `addKeeper` above so a stranger gets `NotWarden(msg.sender)`.
2. Rewrite `pay` to authorise with `msg.sender`, and say what `vm.prank(owner, owner)` sets.
3. A contract keeps a `bytes32 private answer;` and checks guesses against it. Why is it not
   secret, and what do you store instead?

### Answers

1. `function addKeeper(address keeper) external onlyWarden { isKeeper[keeper] = true; }` — the
   `onlyWarden` modifier reverts with `NotWarden(msg.sender)` for anyone else.
2. `if (msg.sender != owner) revert NotOwner(msg.sender);`. `vm.prank(owner, owner)` sets both
   `msg.sender` and `tx.origin` to `owner` for the next call, so a test can imitate the owner
   acting directly or, with a different `msg.sender`, through another contract.
3. Storage is public: `vm.load(address(c), slot)` or an `eth_getStorageAt` call reads `answer`
   before anyone guesses. Store `keccak256(abi.encode(answer, salt))` and reveal later, or keep
   the answer off chain entirely.

## Key takeaways

- Every external function is open; name who may call each and enforce it on the entry point.
- Guard initializers to run once; an open one is the Parity freeze.
- Authorise with `msg.sender`, never `tx.origin`, which any called contract inherits.
- On-chain data is never secret; `private` limits contracts, not readers. Store hashes.
- Leave `DEFAULT_ADMIN_ROLE` as each role's admin unless you mean otherwise; `selfdestruct` no
  longer reliably deletes code and is deprecated.

## Further reading

- [Solidity documentation: Security Considerations, tx.origin](https://docs.soliditylang.org/en/latest/security-considerations.html#tx-origin)
- [OWASP Smart Contract Top 10: 2026, SC01 Access Control Vulnerabilities](https://scs.owasp.org/sctop10)
- [EIP-6780: SELFDESTRUCT only in same transaction](https://eips.ethereum.org/EIPS/eip-6780)
- [OpenZeppelin Contracts 5.x: Access Control](https://docs.openzeppelin.com/contracts/5.x/access-control)
