---
title: Upgradeable Contracts in Practice
summary: Decide whether a contract should be upgradeable, then build one properly with OpenZeppelin 5.7's UUPSUpgradeable, Initializable and ERC1967Proxy, keep its state in an ERC-7201 namespace written by hand, upgrade it with a reinitializer, and test every step and every refusal.
minutes: 45
objectives:
  - Weigh upgradeability against immutability and name who may upgrade and how
  - Write a UUPS implementation with Initializable, _disableInitializers, _authorizeUpgrade and ERC-7201 storage
  - Deploy it behind an ERC1967Proxy in a test and upgrade it with upgradeToAndCall and a reinitializer
  - Apply the storage rules for upgrades and recognise a collision, an open initializer and an unauthorised upgrade
---

## Outline

1. Should it be upgradeable at all?
2. A UUPS implementation
3. Deploying it behind a proxy
4. Storage rules for upgrades
5. Version 2: upgradeToAndCall and a reinitializer
6. Who may upgrade

## Should it be upgradeable at all?

An **upgradeable contract** keeps its address and its state while its code is replaced. That lets
you fix a bug after launch, and it also means users must trust whoever holds the upgrade key: that
person can replace the code with anything, including code that takes every deposit. An immutable
contract cannot be fixed, but nobody can change the rules on its users. Many good protocols
are immutable and ship improvements as new contracts that users opt into.

If you do make it upgradeable, Advanced 08 showed the mechanism: a **proxy** holds the state and
the ether and `delegatecall`s every call to an **implementation**, whose address it keeps in the
ERC-1967 slot `0x3608...2bbc`. In **UUPS** (ERC-1822), the upgrade function lives in the
implementation, so the proxy stays tiny. OpenZeppelin recommends UUPS over the transparent proxy.

OpenZeppelin ships upgradeable versions of its contracts in a separate package,
`@openzeppelin/contracts-upgradeable`, which this course's sandbox does not have. The main package
contains everything this lesson needs: `UUPSUpgradeable` and `Initializable` in `proxy/utils/`,
`ERC1967Proxy` and `ERC1967Utils` in `proxy/ERC1967/`. The state you write by hand.

## A UUPS implementation

A proxy never runs the implementation's constructor, so setup moves into an **initializer**, an
ordinary function that `Initializable`'s `initializer` modifier lets run once. State lives in a
struct at an **ERC-7201 namespace**: slot `keccak256(abi.encode(uint256(keccak256(id)) - 1)) &
~bytes32(uint256(0xff))`, far from slot 0 and from every other namespace.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

contract TipJarV1 is Initializable, UUPSUpgradeable {
    /// @custom:storage-location erc7201:mettle.storage.TipJar
    struct TipJarStorage {
        address owner;
        uint256 total;
    }

    // keccak256(abi.encode(uint256(keccak256("mettle.storage.TipJar")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant TIP_JAR_STORAGE = 0x403fb86c32d1350b74dcb221e8981b5b046cc3ba793bd497e9690216d049a600;

    error NotOwner(address caller);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers(); // nobody can initialize the implementation itself
    }

    function initialize(address owner_) external initializer {
        _tipJar().owner = owner_;
    }

    function tip() external payable {
        _tipJar().total += msg.value;
    }

    function total() external view returns (uint256) {
        return _tipJar().total;
    }

    function _authorizeUpgrade(address) internal view override {
        if (msg.sender != _tipJar().owner) revert NotOwner(msg.sender);
    }

    function _tipJar() internal pure returns (TipJarStorage storage $) {
        assembly {
            $.slot := TIP_JAR_STORAGE
        }
    }
}
```

The full file also has `owner()` and `version()`. `forge inspect TipJarV1 storageLayout` lists no
variables at all, which is the point: nothing sits in the ordinary slots. Upgrade-checking tools
find the namespace through the `@custom:storage-location` annotation instead.

```text
╭------+------+------+--------+-------+----------╮
| Name | Type | Slot | Offset | Bytes | Contract |
+================================================+
╰------+------+------+--------+-------+----------╯
```

Three details carry the security:

- **`_disableInitializers()`** in the constructor sets the implementation's own initialized
  version to the maximum, so nobody can initialize the bare implementation and own it.
- **`_authorizeUpgrade`** is the one function `UUPSUpgradeable` makes you write. Leave it empty
  and anyone can replace your code.
- The **storage pointer** `$` is aimed at the namespace in assembly. Inline assembly accepts only
  literal constants, so the slot is a hex literal with its formula beside it. Solidity 0.8.35's
  builtin `erc7201("mettle.storage.TipJar")` computes the same number at compile time: copy it into
  a local `bytes32` before the assembly block, or use it in a test to check the literal.

## Deploying it behind a proxy

```solidity
function setUp() public {
    TipJarV1 implementation = new TipJarV1();
    ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), abi.encodeCall(TipJarV1.initialize, (OWNER)));
    jar = TipJarV1(address(proxy)); // talk to the proxy through V1's ABI
}
```

The proxy's constructor stores the implementation and `delegatecall`s the encoded `initialize` in
the same transaction, so nobody can initialize it first. In OpenZeppelin 5.7 it even refuses
empty data. What each wrong move produces:

```text
[FAIL: InvalidInitialization()] test_initialize_twice() (gas: 1227690)
[FAIL: ERC1967ProxyUninitialized()] test_proxy_without_data() (gas: 1084470)
[FAIL: NotOwner(0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496)] test_stranger_upgrades() (gas: 2205766)
[FAIL: UUPSUnauthorizedCallContext()] test_upgrade_the_implementation_directly() (gas: 1968311)
```

The last line is UUPS's own guard: `upgradeToAndCall` works only through a proxy that points at
this implementation.

## Storage rules for upgrades

The proxy keeps its state; the new code reads it with the new layout. So:

- never reorder, remove or retype a field, and never insert one before another;
- add fields only at the end of a namespace's struct (or in a new namespace);
- do not give fields initial values or set them in a constructor: neither reaches the proxy.

Break the first rule and the data is still there, read wrongly. A "V2" with `total` and `owner`
swapped, after a 3 ether tip:

```text
owner 0x00000000000000000000000029A2241aF62C0000
total 659918
```

The "owner" is 3 ether's bytes and the "total" is `0xA11CE`, the old owner. A test caught it.
Namespaces also make inheritance safe: OpenZeppelin's `Initializable` keeps its flags in its own
namespace, `openzeppelin.storage.Initializable`. Since 0.8.29 you can move a whole contract's
storage instead, with `contract TipJar is Initializable, UUPSUpgradeable layout at
erc7201("mettle.storage.TipJar") { address public owner; ... }` (Advanced 08); every later
version must keep the same clause.

## Version 2: upgradeToAndCall and a reinitializer

Version 2 appends a field and sets it with **`reinitializer(2)`**, which runs once and only on a
contract initialized to a lower version:

```solidity
struct TipJarStorage {
    address owner;
    uint256 total;
    uint256 minimum; // new in V2: appended, never inserted
}

function initializeV2(uint256 minimum_) external reinitializer(2) {
    _tipJar().minimum = minimum_;
}
```

The owner upgrades and initializes in one call, so no one can slip in between:

```solidity
function test_upgrade_keeps_state() public {
    jar.tip{value: 3 ether}();
    TipJarV2 v2 = new TipJarV2();
    vm.prank(OWNER);
    jar.upgradeToAndCall(address(v2), abi.encodeCall(TipJarV2.initializeV2, (0.01 ether)));
    TipJarV2 upgraded = TipJarV2(address(jar));
    console.log("version", upgraded.version(), "total", upgraded.total());
    console.log("minimum", upgraded.minimum(), "owner", upgraded.owner());
    bytes32 impl = vm.load(address(jar), ERC1967Utils.IMPLEMENTATION_SLOT);
    assertEq(address(uint160(uint256(impl))), address(v2), "implementation slot after the upgrade");
}
```

```text
[PASS] test_upgrade_keeps_state() (gas: 1233156)
Logs:
  version 2 total 3000000000000000000
  minimum 10000000000000000 owner 0x00000000000000000000000000000000000A11cE
```

The same test also checks that a second `initializeV2` reverts with `InvalidInitialization()`.
`upgradeToAndCall` first calls `proxiableUUID()` on the new implementation: a contract without
UUPS would leave the proxy unable to upgrade ever again, so it is refused with
`ERC1967InvalidImplementation(address)`.

## Who may upgrade

`_authorizeUpgrade` decides who can rewrite the contract, so it deserves your strongest control.
A single key is one stolen laptop away from disaster. Production systems give the upgrade right
to a multisig wallet, and often route it through a **timelock**, a contract that delays every
action for days so users can see an upgrade coming and leave first (Professional 07). Before each
upgrade, test it end to end as above, against a copy of the real state, and compare the storage
layouts of both versions.

## Common mistakes

- **An unprotected initializer.** Without `initializer`, anyone can call `initialize(attacker)`
  later and take ownership. With it: `InvalidInitialization()`.
- **An empty `_authorizeUpgrade`.** The upgrade function is then public. Restrict it, and test a
  stranger's attempt: `NotOwner(0x7FA9...1496)`.
- **A constructor in V2 that sets state.** It writes the implementation's storage, not the
  proxy's; use a reinitializer.
- **Calling a reinitializer outside the upgrade.** `reinitializer(2)` limits how often, not who:
  run it inside `upgradeToAndCall`, or check the caller in it.

## Practice

1. Compute the ERC-7201 slot of `"mettle.storage.TipJar"` with the formula and with `erc7201`.
2. Write a test that reads `total` straight from the proxy's storage after a tip.
3. Why must V2 keep `owner` as the struct's first field?

### Answers

```solidity
function test_slot() public pure {
    bytes32 slot = keccak256(abi.encode(uint256(keccak256("mettle.storage.TipJar")) - 1)) & ~bytes32(uint256(0xff));
    console.logBytes32(slot);
    console.logBytes32(bytes32(erc7201("mettle.storage.TipJar")));
}

function test_slot_constant() public {
    jar.tip{value: 5}();
    bytes32 slot = bytes32(erc7201("mettle.storage.TipJar"));
    assertEq(uint256(vm.load(address(jar), bytes32(uint256(slot) + 1))), 5, "total in the namespace's second slot");
}
```

```text
Logs:
  0x403fb86c32d1350b74dcb221e8981b5b046cc3ba793bd497e9690216d049a600
  0x403fb86c32d1350b74dcb221e8981b5b046cc3ba793bd497e9690216d049a600

[PASS] test_slot_constant() (gas: 64230)
```

3. The proxy's base slot already holds the owner written by V1; V2 reads whatever its first
   field's type says is there.

## Key takeaways

- Upgradeability is a trust decision first; immutability is a feature.
- UUPS: `Initializable`, `_disableInitializers()` in the constructor, a strict `_authorizeUpgrade`.
- Deploy with `ERC1967Proxy(implementation, initData)` so initialization is atomic.
- Keep state in ERC-7201 namespaces and only ever append.
- Upgrade with `upgradeToAndCall` and a `reinitializer`, behind a multisig and a timelock.

## Further reading

- [OpenZeppelin Contracts 5.x: Proxies API](https://docs.openzeppelin.com/contracts/5.x/api/proxy)
- [ERC-7201: Namespaced Storage Layout](https://eips.ethereum.org/EIPS/eip-7201)
- [ERC-1967: Proxy Storage Slots](https://eips.ethereum.org/EIPS/eip-1967)
- [OpenZeppelin: Writing upgradeable contracts](https://docs.openzeppelin.com/upgrades-plugins/writing-upgradeable)
