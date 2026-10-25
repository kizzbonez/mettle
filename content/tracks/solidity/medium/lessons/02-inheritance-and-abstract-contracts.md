---
title: Inheritance and Abstract Contracts
summary: Build contracts from base contracts with is, pass arguments to base constructors, override virtual functions and extend them with super, predict the order C3 linearization gives multiple bases, leave hooks open in abstract contracts, and know when composition is the better design.
minutes: 35
objectives:
  - Inherit from a base contract and pass its constructor arguments in both ways
  - Override virtual functions, extend them with super, and call them through the base type
  - Predict the linearized order of several bases and fix the compiler errors that inheritance causes
  - Write an abstract contract with a hook, and choose between an interface, an abstract contract and composition
---

## Outline

1. One contract built from several
2. Base constructors
3. virtual, override and super
4. Multiple inheritance and linearization
5. Abstract contracts
6. Interfaces or abstract contracts?
7. When composition beats inheritance

## One contract built from several

`contract Kiosk is Owned` makes `Owned` a **base contract** of the **derived contract** `Kiosk`:
its state variables, functions, modifiers, events and errors become part of `Kiosk`. Only one
contract is deployed, with one address and one storage. The derived contract can use everything
the base marks `internal` or more visible; `private` members stay inside the base.

```solidity
contract Owned {
    error NotOwner(address caller);

    address public owner;

    constructor(address owner_) {
        owner = owner_;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner(msg.sender);
        _;
    }
}

contract Kiosk is Owned {
    uint256 public price;

    constructor(uint256 price_) Owned(msg.sender) {
        price = price_;
    }

    function setPrice(uint256 price_) external onlyOwner {
        price = price_;
    }

    function describe() public pure virtual returns (string memory) {
        return "kiosk";
    }
}

contract NightKiosk is Kiosk(0.01 ether) {
    function describe() public pure override returns (string memory) {
        return string.concat("night ", super.describe());
    }
}
```

A test stores a new `NightKiosk` in a variable of type `Kiosk` and logs:

```text
  night kiosk
  price 10000000000000000
  owner is the deployer: true
```

## Base constructors

A base constructor's arguments go in one of two places. When they are constants, put them in the
inheritance list: `is Kiosk(0.01 ether)`. When they depend on the derived constructor's
parameters or on `msg.sender`, put them in its header: `constructor(uint256 price_)
Owned(msg.sender)`. A contract that leaves any base constructor without arguments must be
`abstract`.

All constructors run during the one deployment, base first, so `msg.sender` is the deployer in
every one of them. That is why the test contract owns the kiosk.

## virtual, override and super

A function may be replaced in a derived contract only if the base marks it **`virtual`**, and the
replacement must say **`override`**. The override keeps the name and parameters; it may change
visibility only from `external` to `public`, and mutability only to something stricter
(`nonpayable` to `view` to `pure`). A public state variable can implement an interface function:
`uint256 public price;` provides `function price() external view returns (uint256)`.

Calls go to the most derived version, even through a variable of the base type: the test called
`describe()` on a `Kiosk` and got the night kiosk's text. **`super.describe()`** calls the version
one step back, so an override can extend its base instead of replacing it.

Names must stay unambiguous. A function with a base function's name and parameter types must
override it; with other parameters, `describe(uint256 hour)`, it is an overload (Basic 04). A
derived contract cannot declare a state variable named like a visible (non-private) one in a base:
state variables cannot be **shadowed**.

## Multiple inheritance and linearization

A contract can have several bases. Solidity puts them all in one line with **C3
linearization**, and `super` walks that line, which matters when several bases define the same
function. You list direct bases from **most base-like to most derived**: the last one listed is
the closest to you.

```solidity
contract Base {
    function trail() public pure virtual returns (string memory) {
        return "Base";
    }
}

contract Audited is Base {
    function trail() public pure virtual override returns (string memory) {
        return string.concat("Audited > ", super.trail());
    }
}

contract Metered is Base {
    function trail() public pure virtual override returns (string memory) {
        return string.concat("Metered > ", super.trail());
    }
}

contract Final is Audited, Metered {
    function trail() public pure override(Audited, Metered) returns (string memory) {
        return string.concat("Final > ", super.trail());
    }
}
```

`new Final().trail()`, and the same contract with its bases swapped (`Reversed is Metered,
Audited`):

```text
  Final > Metered > Audited > Base
  Reversed > Audited > Metered > Base
```

`super` in `Audited` called `Metered`, a contract `Audited` knows nothing about: the next contract
is decided by the most derived contract's line, and `Base` runs once. Constructors follow the
same line, from `Base` up to `Final`, whatever order you write their arguments in. Because
both bases define `trail`, `Final` must override it and name them, `override(Audited, Metered)`;
leave the function out and solc stops:

```text
Error (6480): Derived contract must override function "trail". Two or more base classes define function with same name and parameter types.
```

An order that contradicts the bases' own order cannot be linearized. `Audited is Base` already
makes `Audited` the more derived of the two, and `contract Wrong is Audited, Base {}` asks for
the opposite:

```text
Error (5005): Linearization of inheritance graph impossible
 --> src/Example.sol:8:1:
  |
8 | contract Wrong is Audited, Base {}
  | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
```

## Abstract contracts

An **abstract contract** may leave functions without a body. It cannot be deployed, but it can
hold state, a constructor and finished functions that call the open ones. That makes it the place
for shared rules with a **hook** that each derived contract fills in:

```solidity
/// @notice Shared rules for every tollgate; each kind decides its own toll.
abstract contract Tollgate {
    error Underpaid(uint256 sent, uint256 toll);

    uint256 public passes;

    function pass() external payable {
        uint256 due = toll(msg.sender);
        if (msg.value < due) revert Underpaid(msg.value, due);
        passes++;
    }

    /// @notice The toll for `driver`, in wei. Every concrete gate must say.
    function toll(address driver) public view virtual returns (uint256);
}

contract FlatToll is Tollgate {
    function toll(address) public pure override returns (uint256) {
        return 0.002 ether;
    }
}
```

A test passes once with 0.002 ether, then tries with 0.001 ether:

```text
[FAIL: Underpaid(1000000000000000 [1e15], 2000000000000000 [2e15])] test_flat_toll() (gas: 322491)
Logs:
  passes 1
```

`new Tollgate()` fails with `Cannot instantiate an abstract contract.`, and a derived contract
that forgets `toll` fails with `Contract "NoToll" should be marked as abstract.`

## Interfaces or abstract contracts?

An interface (lesson 01) is a pure promise about the outside: external functions, events and
errors, no code, no state. Depend on interfaces for contracts you call. An abstract contract is
unfinished code you inherit, with state and internal helpers. Use it to share logic between your
own contracts.

## When composition beats inheritance

Inheritance flattens everything into one contract. `forge inspect NightKiosk storageLayout` shows
`Owned`'s variable in the derived contract's storage:

```text
╭-------+---------+------+--------+-------+-------------------------------╮
| Name  | Type    | Slot | Offset | Bytes | Contract                      |
+=========================================================================+
| owner | address | 0    | 0      | 20    | test/Example.t.sol:NightKiosk |
|-------+---------+------+--------+-------+-------------------------------|
| price | uint256 | 1    | 0      | 32    | test/Example.t.sol:NightKiosk |
╰-------+---------+------+--------+-------+-------------------------------╯
```

Every public function of every base is part of your contract's surface, whether you meant to
expose it or not, so read a base before inheriting it. Deep hierarchies are hard to audit and run
into the 24 KB code size limit (Medium 07). **Composition**, separate contracts that call each
other through interfaces, keeps parts independent, each with its own address, storage and
permissions, at the cost of external calls. Inherit small, well-known building blocks such as
ownership; compose independent parts, such as a token and the vault that holds it.

## Common mistakes

- **No `virtual` on the base function.** `Error (4334): Trying to override non-virtual function.
  Did you forget to add "virtual"?` Add `virtual`, or leave the function alone.
- **No `override` on the new one.** `Error (9456): Overriding function is missing "override"
  specifier.`
- **Forgetting `super`.** If `Metered` returns `"Metered"` without calling `super.trail()`,
  `Final` gives `Final > Metered`: `Audited` and `Base` are skipped silently. When the skipped
  code is a check, the check is gone.
- **Redeclaring a base's state variable.** `address public owner;` in `Kiosk` fails with
  `Error (9097): Identifier already declared.` State variables cannot be shadowed; rename it.
- **Virtual modifiers.** Since 0.8.31: `Warning (8429): Virtual modifiers are deprecated and
  scheduled for removal.` Let the modifier call an internal virtual function instead.

## Practice

1. Predict `new Mixed().trail()` for `contract Mixed is Base, Metered, Audited`, whose `trail`
   prefixes `"Mixed > "`. What must its `override(...)` list?
2. Write `DoubleToll is FlatToll`, charging twice the flat toll through `super`.
3. Fix `contract Wrong is Audited, Base {}` in the smallest way.

### Answers

```solidity
contract Mixed is Base, Metered, Audited {
    function trail() public pure override(Base, Audited, Metered) returns (string memory) {
        return string.concat("Mixed > ", super.trail());
    }
}

// FlatToll's toll must now be `public pure virtual override`.
contract DoubleToll is FlatToll {
    function toll(address driver) public pure override returns (uint256) {
        return 2 * super.toll(driver);
    }
}

contract Fixed is Audited {} // Audited already brings Base
```

```text
  Mixed > Audited > Metered > Base
  double toll 4000000000000000
  Audited > Base
```

`Base` is a direct base of `Mixed` here, so leaving it out of the list fails with `Function needs
to specify overridden contract "Base".`

## Key takeaways

- `is` merges bases into one contract; constructors run base first, all with the deployer as
  `msg.sender`.
- `virtual` allows an override, `override` claims one, and `super` calls the next contract in the
  linearized order.
- List bases from most base-like to most derived; name every base in `override(...)`.
- Abstract contracts share code and leave hooks; interfaces describe contracts you call.
- Prefer composition for independent parts, and read every base you inherit.

## Further reading

- [Solidity documentation: Inheritance](https://docs.soliditylang.org/en/latest/contracts.html#inheritance)
- [Solidity documentation: Multiple inheritance and linearization](https://docs.soliditylang.org/en/latest/contracts.html#multiple-inheritance-and-linearization)
- [Solidity documentation: Abstract contracts](https://docs.soliditylang.org/en/latest/contracts.html#abstract-contracts)
- [Solidity by Example: Inheritance](https://solidity-by-example.org/inheritance/)
