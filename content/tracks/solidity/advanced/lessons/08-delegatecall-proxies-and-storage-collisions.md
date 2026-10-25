---
title: delegatecall, Proxies and Storage Collisions
summary: Understand how delegatecall runs another contract's code on your storage, how upgradeable proxies use it, why a proxy and its implementation can overwrite each other's variables, and how ERC-1967 slots, ERC-7201 namespaces, solc's erc7201 builtin and `layout at`, and locked initializers prevent it.
minutes: 40
objectives:
  - Explain what delegatecall keeps and what it changes, and show a storage collision in a test
  - Describe ERC-1967 slots and the difference between transparent and UUPS proxies
  - Place state in an ERC-7201 namespace with the erc7201 builtin, or move a contract's storage with layout at
  - Protect an implementation with initializers and _disableInitializers, and spot an upgrade that shifts storage
---

## Outline

1. delegatecall: borrowed code, your storage
2. A proxy and a storage collision
3. ERC-1967 slots, transparent and UUPS proxies
4. Initializers and uninitialised implementations
5. ERC-7201 namespaces and the erc7201 builtin
6. Moving all storage with layout at

## delegatecall: borrowed code, your storage

Medium 06 introduced **`delegatecall`**: contract A runs contract B's code *as if it were its
own*. The code comes from B; everything else stays A's: its storage, its balance,
`address(this)`, and `msg.sender` and `msg.value` from the call into A. B's code knows its
variables only by **slot number** (the position Basic 08 showed with `forge inspect`), so it
reads and writes A's slots by B's layout. If the two layouts disagree, B's code silently
corrupts A. And delegating to code an attacker chooses hands them all of A's storage and ether.

## A proxy and a storage collision

A **proxy** is a small contract whose `fallback` delegatecalls every call to an
**implementation**. Users keep one address and its storage, while the code can be replaced: an
**upgrade** points the proxy at a new implementation. OpenZeppelin's abstract `Proxy` does the
forwarding; this one keeps the implementation's address in an ordinary variable:

```solidity
contract NaiveProxy is Proxy {
    address public implementation; // slot 0

    constructor(address implementation_) {
        implementation = implementation_;
    }

    function _implementation() internal view override returns (address) {
        return implementation;
    }

    receive() external payable {}
}

contract Vault {
    uint256 public total; // slot 0 as well
    mapping(address => uint256) public balanceOf;

    function deposit() external payable {
        balanceOf[msg.sender] += msg.value;
        total += msg.value;
    }
}

function test_a_deposit_overwrites_the_implementation() public {
    NaiveProxy proxy = new NaiveProxy(address(new Vault()));
    Vault vault = Vault(address(proxy)); // the proxy, called through Vault's interface
    console.log("implementation before", proxy.implementation());

    vault.deposit{value: 1 ether}(); // Vault's code runs on the proxy's storage
    console.log("implementation after ", proxy.implementation());
    console.log("proxy balance", address(proxy).balance);
    vault.total();
}
```

```text
[FAIL: EvmError: Revert] test_a_deposit_overwrites_the_implementation() (gas: 500820)
Logs:
  implementation before 0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f
  implementation after  0x5615Deb798Bb3E4dFA0139dfAf948Ae77387B72f
  proxy balance 1000000000000000000
```

`total += msg.value` added 1 ether to slot 0, which held the implementation's address. The
proxy now delegates to an empty account, so every call returns nothing and the ether is stuck.
`forge inspect` shows the clash: `implementation` and `total` are both slot 0. This is a
**storage collision**.

## ERC-1967 slots, transparent and UUPS proxies

**ERC-1967** fixes the proxy's side: the implementation's address lives at
`bytes32(uint256(keccak256("eip1967.proxy.implementation")) - 1)`, which is
`0x3608...2bbc`, and the admin's at a slot made the same way. No compiler places a variable
there, and the "minus one" means the slot is not the hash of any known input. OpenZeppelin's
`ERC1967Proxy` uses these slots.

Upgrade code lives in one of two places. In a **transparent proxy**, the proxy itself has the
upgrade function, callable only by its admin, and the admin's calls never reach the
implementation, so a proxy function and an implementation function with the same 4-byte
selector cannot be confused. In a **UUPS proxy** (ERC-1822), the proxy is minimal and the
*implementation* has `upgradeToAndCall`, guarded by an `_authorizeUpgrade` you write. Leave it
unguarded and anyone can upgrade to their own code; upgrade to code without it and the proxy
can never upgrade again. Professional 03 builds UUPS upgrades step by step.

## Initializers and uninitialised implementations

A constructor runs on the implementation's own storage, never the proxy's, so upgradeable
contracts set themselves up in an **initializer**, a function that must run exactly once,
through the proxy. OpenZeppelin's `Initializable` gives the `initializer` modifier, and
`_disableInitializers()` in the constructor locks the implementation itself:

```solidity
contract VaultV1 is Initializable {
    address public owner;
    uint256 public total;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers(); // nobody can initialize the implementation itself
    }

    /// @notice Runs once, through the proxy, instead of a constructor.
    function initialize(address owner_) external initializer {
        owner = owner_;
    }
}

// in the test: deploy and initialize in one transaction, so nobody can initialize first
ERC1967Proxy proxy = new ERC1967Proxy(address(logic), abi.encodeCall(VaultV1.initialize, (owner)));
console.log("owner via proxy", VaultV1(address(proxy)).owner());
console.logBytes32(vm.load(address(proxy), IMPLEMENTATION_SLOT));
console.logBytes32(vm.load(address(proxy), bytes32(0))); // slot 0 is the vault's owner
logic.initialize(makeAddr("attacker"));
```

```text
[FAIL: InvalidInitialization()] test_proxy_with_an_initializer() (gas: 641251)
Logs:
  owner via proxy 0x7c8999dC9a822c1f0Df42023113EDB4FDd543266
  0x0000000000000000000000005615deb798bb3e4dfa0139dfa1b3d433cc23b72f
  0x0000000000000000000000007c8999dc9a822c1f0df42023113edb4fdd543266
```

An **uninitialised implementation** is a real danger. In 2017 a Parity wallet library that
every multisig delegated to was never initialised; a user initialised it, became its owner and
destroyed it, freezing the wallets' ether. In 2021 OpenZeppelin fixed the same class of flaw in
UUPS implementations (CVE-2021-41264, version 4.3.2). Since EIP-6780 (Cancun, 2024)
`selfdestruct` no longer deletes code outside its creating transaction, but an attacker who
owns your implementation can still use whatever power that gives.

## ERC-7201 namespaces and the erc7201 builtin

The implementation's own variables must also keep their slots from one version to the next:
inserting a variable moves every later one (see Practice). **ERC-7201** namespaces avoid the
problem: a struct lives at `keccak256(abi.encode(uint256(keccak256(id)) - 1)) & ~bytes32(uint256(0xff))`,
annotated `@custom:storage-location erc7201:<id>`. OpenZeppelin 5's upgradeable contracts
store their state this way. Since solc 0.8.35, the builtin **`erc7201(id)`** computes that slot
at compile time:

```solidity
/// @custom:storage-location erc7201:orchard.vault
struct VaultStorage {
    address owner;
    uint256 total;
}

// erc7201 (solc 0.8.35+) computes the namespace's base slot at compile time
bytes32 private constant VAULT_STORAGE = bytes32(erc7201("orchard.vault"));

function _vault() private pure returns (VaultStorage storage $) {
    bytes32 location = VAULT_STORAGE; // assembly reads a local, not this constant
    assembly {
        $.slot := location
    }
}
```

The three-line `assembly` block points a storage reference at the slot (Professional 02 covers
assembly). A test that stores `0xA11CE` as the owner, then reads the slot computed by hand and
slot 0:

```text
Logs:
  0xd763ab1e49a620d3145e1298fd6960a44793f3be458b58fdf11f8932bf37d800
  0x00000000000000000000000000000000000000000000000000000000000a11ce
  0x0000000000000000000000000000000000000000000000000000000000000000
```

## Moving all storage with layout at

Since solc 0.8.29, a **custom storage layout** moves *every* state variable of a contract to a
base slot, with no assembly: `layout at <expression>` in the contract's header, where the
expression is a compile-time constant, and `erc7201(...)` is allowed:

```solidity
contract Ledger layout at erc7201("orchard.ledger") {
    address public owner;
    uint256 public total;
}
```

`forge inspect Ledger storageLayout` prints:

```text
╭-------+---------+------------------------------------------------------------------------------+--------+-------+------------------------╮
| Name  | Type    | Slot                                                                         | Offset | Bytes | Contract               |
+==========================================================================================================================================+
| owner | address | 1424133016219556281163155066329968969578329023588914478625854923792162863104 | 0      | 20    | src/Example.sol:Ledger |
|-------+---------+------------------------------------------------------------------------------+--------+-------+------------------------|
| total | uint256 | 1424133016219556281163155066329968969578329023588914478625854923792162863105 | 0      | 32    | src/Example.sol:Ledger |
╰-------+---------+------------------------------------------------------------------------------+--------+-------+------------------------╯
```

Only the most derived contract may say it: an abstract contract gets `Error (7587): Storage
layout cannot be specified for abstract contracts.`, and inheriting from `Ledger` gets
`Error (8894): Cannot inherit from a contract with a custom storage layout.` It does not move
transient variables.

## Common mistakes

- **Proxy state in ordinary slots.** A deposit turned the implementation's address into
  `0x5615Deb798Bb3E4dFA0139dfAf948Ae77387B72f`. Use ERC-1967 slots (`ERC1967Proxy`).
- **Deploying a proxy without initializing it.** OpenZeppelin 5.7's `ERC1967Proxy` refuses empty
  initialization data with `ERC1967ProxyUninitialized()`; pass the `initialize` call.
- **An unlocked implementation.** Without `_disableInitializers()`, anyone can call
  `initialize` on the implementation and own it.
- **Reading an `erc7201` constant in assembly.** `$.slot := VAULT_STORAGE` fails with
  `Error (7615): Only direct number constants and references to such constants are supported by
  inline assembly.` Copy it into a local first.

## Practice

1. A proxy keeps `address implementation; address admin;` and its implementation declares
   `uint256 count; address owner;`. Which variables collide?
2. `LedgerV1` has `owner, total`; `LedgerV2` inserts `fee` between them. After an upgrade, what do
   `fee()` and `total()` return for a ledger whose total was 5 ether?
3. How do you give `LedgerV2 is Ledger` a custom layout?

### Answers

```solidity
function test_2_an_inserted_variable() public {
    ERC1967Proxy proxy = new ERC1967Proxy(address(new LedgerV1()), abi.encodeCall(LedgerV1.setTotal, (5 ether)));
    // what an upgrade does: point the implementation slot at the new code
    vm.store(address(proxy), IMPLEMENTATION_SLOT, bytes32(uint256(uint160(address(new LedgerV2())))));
    console.log("fee  ", LedgerV2(address(proxy)).fee());
    console.log("total", LedgerV2(address(proxy)).total());
}
```

```text
[PASS] test_2_an_inserted_variable() (gas: 595485)
Logs:
  fee   5000000000000000000
  total 0
```

1: `count` collides with `implementation` (slot 0) and `owner` with `admin` (slot 1). 2: the old
total now reads as the fee; append new variables at the end, or use a namespace. 3: move
`layout at` from `Ledger` to `LedgerV2`; only the most derived contract may have it.

## Key takeaways

- `delegatecall` runs another contract's code on your storage, balance and `msg.sender`.
- Proxy and implementation must never use the same slots: ERC-1967 puts proxy state at hashed slots.
- Initialize through the proxy, in the deploying transaction, and lock implementations with
  `_disableInitializers()`.
- Keep layouts append-only across versions, or use ERC-7201 namespaces; `erc7201(id)` and
  `layout at` (solc 0.8.29+) compute and apply them.

## Further reading

- [ERC-1967: Proxy Storage Slots](https://eips.ethereum.org/EIPS/eip-1967)
- [ERC-7201: Namespaced Storage Layout](https://eips.ethereum.org/EIPS/eip-7201)
- [Solidity documentation: custom storage layout](https://docs.soliditylang.org/en/latest/contracts.html#custom-storage-layout)
- [OpenZeppelin Contracts: Proxies](https://docs.openzeppelin.com/contracts/5.x/api/proxy)
