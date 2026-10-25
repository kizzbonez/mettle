---
title: Using OpenZeppelin Contracts
summary: Build on OpenZeppelin Contracts 5.x instead of home-made checks, with Ownable and Ownable2Step, AccessControl roles and admin roles, Pausable, ReentrancyGuardTransient, SafeERC20 and Address, Math, SafeCast and Strings, and extend tokens through the _update hook, with a pinned version you have read.
minutes: 40
objectives:
  - Choose between Ownable, Ownable2Step and AccessControl, and set up roles with their admin roles in a constructor
  - Protect functions with whenNotPaused and nonReentrant, and say why ReentrancyGuardTransient is now preferred
  - Move tokens with SafeERC20, compute with Math.mulDiv and SafeCast, and recognise each library's custom errors
  - Combine two token extensions by overriding _update, and pin and read the library version you depend on
---

## Outline

1. Why an audited library, and how to depend on it
2. Ownership: Ownable and Ownable2Step
3. Roles: AccessControl and admin roles
4. Pausable and ReentrancyGuardTransient
5. Tokens and ether: SafeERC20 and Address
6. Numbers and text: Math, SafeCast and Strings
7. Extending through hooks: _update

## Why an audited library, and how to depend on it

Lessons 04 and 05 already built tokens on **OpenZeppelin Contracts**, the most used library of
reviewed Solidity components. Every check you write yourself is one more place for a bug; the
library's code has been audited, fuzzed and attacked in production for years. It does not make
your contract safe: it gives you parts that behave exactly as documented, so that your review can
concentrate on your own logic.

Depend on it like this:

- **Pin a tagged release**: `forge install OpenZeppelin/openzeppelin-contracts@v5.7.0`, with the
  remapping `@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/`. Never build on the
  development branch. The labs here have 5.7.0 installed.
- **Read the source** you inherit, in `lib/openzeppelin-contracts/contracts/`. The comments are
  the specification, and they hold warnings, such as the note in 5.7's `ReentrancyGuard.sol`
  that it is deprecated and will be replaced by `ReentrancyGuardTransient` in 6.0.
- **Know what changed in 5.0**: custom errors replaced revert strings, a single `_update` hook
  replaced `_beforeTokenTransfer` and `_afterTokenTransfer`, `Ownable` takes its first owner in
  the constructor, `Pausable` and `ReentrancyGuard` moved to `utils/`, and `SafeMath`,
  `Counters` and `PullPayment` were removed. A 4.x tutorial does not compile against 5.x.
- The library follows semantic versioning, but internal functions may change between minor
  versions: after an upgrade, re-check every function you override.

## Ownership: Ownable and Ownable2Step

`Ownable(initialOwner)` gives one address the `onlyOwner` functions. A one-step
`transferOwnership` to a mistyped address loses the contract for ever, so prefer
**`Ownable2Step`**: the new owner must call `acceptOwnership`.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

/// @notice A noticeboard whose owner hands over in two steps.
contract Noticeboard is Ownable2Step {
    string public notice;

    constructor(address initialOwner) Ownable(initialOwner) {}

    function post(string calldata text) external onlyOwner {
        notice = text;
    }
}
```

A test lets Ada start the handover, Ben accept, and Ada then try to post:

```text
[FAIL: OwnableUnauthorizedAccount(0xff0d0d92273e943Bb142646733BE1f88Ea15EaEF)] test_TwoStepHandover() (gas: 829214)
Logs:
  owner is still ada: true pending: true
  owner is now ben: true
```

`renounceOwnership()` sets the owner to zero and disables every `onlyOwner` function; override
it to revert if your contract must always have an owner.

## Roles: AccessControl and admin roles

One owner is too much power in one key. **`AccessControl`** names roles as `bytes32`
constants, guards functions with `onlyRole(role)`, and gives every role an **admin role** whose
holders grant and revoke it. `DEFAULT_ADMIN_ROLE` is the admin of every role, and of itself,
until `_setRoleAdmin` says otherwise. Grant the first roles with the internal `_grantRole` in the
constructor.

```solidity
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuardTransient} from "@openzeppelin/contracts/utils/ReentrancyGuardTransient.sol";

/// @notice A neighbourhood fund that pays small grants in a token.
contract GrantFund is AccessControl, Pausable, ReentrancyGuardTransient {
    using SafeERC20 for IERC20;

    bytes32 public constant GRANTER_ROLE = keccak256("GRANTER_ROLE");
    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");

    IERC20 public immutable token;

    event GrantPaid(address indexed to, uint256 amount);

    constructor(IERC20 token_, address admin) {
        token = token_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _setRoleAdmin(GUARDIAN_ROLE, GRANTER_ROLE); // granters appoint the guardians
    }

    function payGrant(address to, uint256 amount) external onlyRole(GRANTER_ROLE) whenNotPaused nonReentrant {
        emit GrantPaid(to, amount);
        token.safeTransfer(to, amount);
    }

    function pause() external onlyRole(GUARDIAN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(GUARDIAN_ROLE) {
        _unpause();
    }
}
```

The admin appoints Gina as a granter, Gina appoints Gus as a guardian, and four tests then do
what the rules forbid, without expecting the revert, to show the library's errors:

```text
[PASS] test_AGranterPays() (gas: 81592)
[FAIL: AccessControlUnauthorizedAccount(0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496, 0x2dee5dd865e09c7ce6788d674a03682994f0b44339403ca07ac129a9de4bed6a)] test_AStrangerPays() (gas: 30684)
[FAIL: SafeERC20FailedOperation(0x5991A2dF15A8F6A256D3Ec51E99254Cd3fb576A9)] test_ATokenThatReturnsFalse() (gas: 1258999)
[FAIL: EnforcedPause()] test_PayingWhilePaused() (gas: 88358)
[FAIL: AccessControlUnauthorizedAccount(0xaA10a84CE7d9AE517a52c6d5cA153b369Af99ecF, 0x2dee5dd865e09c7ce6788d674a03682994f0b44339403ca07ac129a9de4bed6a)] test_TheAdminAppointsAGuardian() (gas: 43978)
```

The second argument is the missing role, `keccak256("GRANTER_ROLE")`: even the admin cannot
appoint a guardian now. Holders are found from the `RoleGranted` and `RoleRevoked` events.
For the admin role itself, `AccessControlDefaultAdminRules` adds a single holder, two-step
transfers and a delay.

## Pausable and ReentrancyGuardTransient

**`Pausable`** gives you `whenNotPaused`, `whenPaused` and the internal `_pause` and `_unpause`;
you decide who may call them. Pause what must stop in an emergency, and leave open what people
need then, such as withdrawals. **`ReentrancyGuardTransient`**'s `nonReentrant` reverts with
`ReentrancyGuardReentrantCall()` when a guarded function is entered again during a call, for
example by a token with transfer hooks. It keeps its flag in transient storage (Basic 08), which
is cheaper than the older storage-based `ReentrancyGuard` and needs the Cancun EVM or later. The
guard backs up checks-effects-interactions; it does not replace the habit.

## Tokens and ether: SafeERC20 and Address

ERC-20 says `transfer` returns `bool`, but some tokens return `false` instead of reverting, and
some old ones return nothing. A plain `token.transfer(to, x)` ignores a `false`, and `forge lint`
warns about it:

```text
warning[erc20-unchecked-transfer]: ERC20 `transfer` or `transferFrom` call does not check the return value
   ╭▸ src/Board.sol:20:9
   │
20 │         token.transfer(to, amount);
   │         ━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Wrapping it in `require` breaks on tokens that return nothing. `SafeERC20`'s `safeTransfer`,
`safeTransferFrom` and `forceApprove` accept both and revert with
`SafeERC20FailedOperation(token)` on a real failure. For ether, `Address.sendValue(to, amount)`
is the checked `call` from Basic 11: it reverts with `InsufficientBalance`, the recipient's own
error or `FailedCall`, and hands control to the recipient like any call.

## Numbers and text: Math, SafeCast and Strings

```solidity
        console.log(Math.mulDiv(type(uint256).max, 3, 4));
        console.log(Math.mulDiv(10, 1, 3), Math.mulDiv(10, 1, 3, Math.Rounding.Ceil));
        console.log(string.concat("Plot ", Strings.toString(uint256(42))));
        console.log(SafeCast.toUint64(2 ** 64));
```

```text
[FAIL: SafeCastOverflowedUintDowncast(64, 18446744073709551616 [1.844e19])] test_Helpers() (gas: 12983)
Logs:
  86844066927987146567678238756515930889952488499230423029593188005934847229951
  3 4
  Plot 42
```

`mulDiv` computes `x * y / d` at full precision, so the product may exceed 256 bits, and rounds
the way you ask. A plain `uint64(x)` silently cuts high bits; `SafeCast` reverts instead.
`Strings` turns numbers and addresses into text.

## Extending through hooks: _update

ERC-20 balances change only in `_update` (lesson 04). Two extensions that both override it must
be reconciled by you:

```text
Error (6480): Derived contract must override function "_update". Two or more base classes define function with same name and parameter types.
 --> src/Token.sol:9:1:
  |
9 | contract HallToken is ERC20Capped, ERC20Pausable, Ownable {
```

```solidity
    function _update(address from, address to, uint256 value) internal override(ERC20Capped, ERC20Pausable) {
        super._update(from, to, value);
    }
```

`super` runs both extensions, in the linearised order of Medium 02. Minting past the cap and
transferring while paused then fail:

```text
[FAIL: ERC20ExceededCap(1000001000000000000000000 [1e24], 1000000000000000000000000 [1e24])] test_Cap() (gas: 1328713)
[FAIL: EnforcedPause()] test_CapAndPause() (gas: 1386882)
```

## Common mistakes

- **Following a 4.x tutorial.** `contract OldStyle is Ownable` with no owner argument fails with
  `Error (3415): No arguments passed to the base constructor. Specify the arguments or mark "OldStyle" as abstract.`,
  and the old path `@openzeppelin/contracts/security/Pausable.sol` with `Error (6275): Source ... not found`.
  Pass `Ownable(initialOwner)` and import from `utils/`.
- **Ignoring a transfer's result.** A token that returns `false` leaves you crediting money you
  never received. Use `SafeERC20`; `forge lint` flags the plain call.
- **Leaving every role under one admin.** Without `_setRoleAdmin`, the default admin can do
  everything, and so can whoever steals its key. Give roles their own admins, and hold the
  default admin in a multisig.
- **Forgetting `super` in an override.** An `_update` without `super._update` moves nothing: a
  token that mints 100e18 in its constructor reports `supply after minting 100e18: 0`. Call
  `super`.

## Practice

1. Who can call `grantRole(GUARDIAN_ROLE, x)` on `GrantFund`, and what does anyone else get?
2. What does `Math.mulDiv(7, 3, 2, Math.Rounding.Floor)` return, and with `Ceil`?
3. Why must `HallToken` call `super._update` rather than `ERC20Pausable._update`?

### Answers

1. Holders of `GRANTER_ROLE`, the admin of `GUARDIAN_ROLE`. Anyone else, the default admin
   included, gets `AccessControlUnauthorizedAccount(caller, GRANTER_ROLE)`, as the output above
   shows.
2. 21 / 2 = 10.5, so 10 and 11:

   ```solidity
   console.log(Math.mulDiv(7, 3, 2, Math.Rounding.Floor), Math.mulDiv(7, 3, 2, Math.Rounding.Ceil));
   ```

   ```text
     10 11
   ```

3. `super` follows the linearisation, so both `ERC20Capped` and `ERC20Pausable` run, then
   `ERC20`. Naming one base would skip the other: the cap would not be enforced.

## Key takeaways

- Pin a tagged OpenZeppelin release, read the source you inherit, and re-check overrides after
  every upgrade.
- `Ownable2Step` for a single owner; `AccessControl` with separate admin roles for more.
- `whenNotPaused` and `nonReentrant` are modifiers you place; `ReentrancyGuardTransient` is the
  current guard.
- `SafeERC20` for every token transfer, `Math.mulDiv` for precise ratios, `SafeCast` for
  narrowing.
- Combine extensions by overriding `_update` with every base listed, and call `super`.

## Further reading

- [OpenZeppelin Contracts 5.x: Access Control](https://docs.openzeppelin.com/contracts/5.x/access-control)
- [OpenZeppelin Contracts 5.x: Extending Contracts](https://docs.openzeppelin.com/contracts/5.x/extending-contracts)
- [OpenZeppelin Contracts 5.x API: Utils](https://docs.openzeppelin.com/contracts/5.x/api/utils)
- [OpenZeppelin Contracts changelog](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/CHANGELOG.md)
