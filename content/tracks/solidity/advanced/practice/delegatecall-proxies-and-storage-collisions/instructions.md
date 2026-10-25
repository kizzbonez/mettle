`solution.sol` holds the co-op's two contracts. `DuesProxy` (built on OpenZeppelin's `Proxy`)
delegates every call to its implementation; `DuesVault` is that implementation. Users call the
vault through the proxy's address, so the vault's code runs on the proxy's storage. Fix three
bugs; keep every function, parameter, event and error.

1. **Storage collision.** The proxy keeps `implementation` and `admin` in ordinary state
   variables, slots 0 and 1, which are also the vault's `treasurer` and `total`: initializing
   the vault overwrites the implementation's address. Remove both state variables and keep the
   two addresses in the ERC-1967 slots the starter declares, `IMPLEMENTATION_SLOT` and
   `ADMIN_SLOT`, through OpenZeppelin's `StorageSlot` (imported):
   `StorageSlot.getAddressSlot(ADMIN_SLOT).value = msg.sender;` writes one, and `.value` reads
   it. Add `implementation()` and `admin()` as `external view` functions that return them (the
   public variables used to provide those getters). `upgradeTo` still reverts with
   `NotAdmin(caller)` for anyone but the admin and emits `Upgraded(newImplementation)`, as the
   constructor does.
2. **A second `initialize`.** Anyone can call `initialize` again through the proxy and make
   themselves treasurer. Make `DuesVault` inherit OpenZeppelin's `Initializable` (imported) and
   give `initialize` the `initializer` modifier, so a second call reverts with
   `InvalidInitialization()`.
3. **An unlocked implementation.** Give `DuesVault` a constructor that calls
   `_disableInitializers()`, so that nobody can initialize the implementation contract itself
   (that also reverts with `InvalidInitialization()`).

The vault's own variables stay where they are: `treasurer` in slot 0, `total` in slot 1, then
`paid`. A later version must keep them in that order and add new ones after them.

```solidity
DuesVault logic = new DuesVault();
DuesProxy proxy = new DuesProxy(address(logic), abi.encodeCall(DuesVault.initialize, (treasurer)));
DuesVault vault = DuesVault(address(proxy));
vault.treasurer();                         // treasurer
proxy.implementation();                    // address(logic), also found in IMPLEMENTATION_SLOT
vault.payDues{value: 0.25 ether}();        // as a member: paid(member) is 0.25 ether
proxy.implementation();                    // still address(logic)
vault.withdraw(treasurer, 0.1 ether);      // as the treasurer: total() is now 0.15 ether
vault.initialize(attacker);                // reverts with InvalidInitialization()
logic.initialize(attacker);                // reverts with InvalidInitialization()
```

The hidden tests pay dues and check that the proxy's state and the vault's low slots stay
apart, upgrade to a next version, and try to take the vault over through both initializers.
