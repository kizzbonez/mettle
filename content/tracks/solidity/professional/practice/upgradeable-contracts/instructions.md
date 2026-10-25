`solution.sol` holds two implementations of one stamp card: `StampCardV1`, which the tests deploy
behind OpenZeppelin's `ERC1967Proxy`, and `StampCardV2`, which they upgrade it to. Both inherit
`Initializable` and `UUPSUpgradeable`. Keep every name, signature, error and event.

1. **Namespaced storage (V1).** All state lives in `StampCardStorage` at the ERC-7201 base slot of
   the namespace `"bakery.storage.StampCard"`:
   `keccak256(abi.encode(uint256(keccak256("bakery.storage.StampCard")) - 1)) & ~bytes32(uint256(0xff))`.
   Make `_stampCard()` point `$` there: assign the slot to the local `slot`, either as a
   `bytes32` literal you computed or as `bytes32(erc7201("bakery.storage.StampCard"))`. The
   contract must declare no other state variables.
2. **Initialization (V1).** The constructor calls `_disableInitializers()`. `initialize(address
   owner_)` has the `initializer` modifier, reverts with `ZeroOwner()` for `address(0)`, and stores
   the owner.
3. **Upgrade authorization (V1).** `_authorizeUpgrade` reverts with `NotOwner(msg.sender)` unless
   the owner calls.
4. **Version 2 storage and reinitializer.** In `StampCardV2`, append `uint256 threshold` to the
   struct after every V1 field, and use the same base slot. `initializeV2(uint256 threshold_)` has
   `reinitializer(2)`, reverts with `NotOwner(msg.sender)` unless the owner calls (an upgrade made
   without it must not let anyone else set the price), reverts with `ZeroThreshold()` for 0, and
   stores the threshold. `threshold()` returns it.
5. **`redeem()` (V2).** The caller trades `threshold` stamps for a loaf: revert with
   `NotEnoughStamps(have, need)` if they have fewer, otherwise subtract the threshold from their
   stamps (`totalStamps` stays, it counts every stamp ever given) and emit
   `Redeemed(caller, stampsLeft)`.

```solidity
StampCardV1 implementation = new StampCardV1();
ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), abi.encodeCall(StampCardV1.initialize, (baker)));
StampCardV1 card = StampCardV1(address(proxy));
// as the baker:
card.stamp(ada); card.stamp(ada); card.stamp(ada);
card.upgradeToAndCall(address(new StampCardV2()), abi.encodeCall(StampCardV2.initializeV2, (3)));
StampCardV2 upgraded = StampCardV2(address(proxy));
upgraded.version();      // 2
upgraded.stampsOf(ada);  // 3, kept through the upgrade
// as ada:
upgraded.redeem();       // emits Redeemed(ada, 0)
```

The hidden tests read the proxy's storage slots directly with `vm.load`, so the layout must be
exactly the one above.
