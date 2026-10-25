`solution.sol` holds two finished contracts, `PlotRegistry` (an `Ownable2Step`) and `WaterRota`,
and the deploy script `DeployGarden is Script`, with `run()` written. Write the two functions
that `run()` relies on. The tests call your script the way `forge script` would, on the local
EVM.

1. **`predictRegistry(address deployer) public pure returns (address)`**: the address where
   `new PlotRegistry{salt: SALT}(deployer)` lands when it is broadcast. Under a broadcast, forge
   sends every salted `new` through the CREATE2 factory, whose address forge-std names
   `CREATE2_FACTORY`, so the factory is the creator, not the script. Compute the CREATE2
   formula yourself:
   - the init code hash is `keccak256` of the creation code followed by the encoded constructor
     argument: `abi.encodePacked(type(PlotRegistry).creationCode, abi.encode(deployer))`;
   - the address is the last 20 bytes of
     `keccak256(abi.encodePacked(bytes1(0xff), CREATE2_FACTORY, SALT, initCodeHash))`, that is
     `address(uint160(uint256(hash)))`.
2. **`deploy(address deployer, address council, address[] memory firstHolders)`**, returning
   `(PlotRegistry registry, WaterRota rota)`:
   1. start broadcasting as `deployer` with `vm.startBroadcast(deployer)`;
   2. deploy `new PlotRegistry{salt: SALT}(deployer)`: the deployer owns it at first, so that it
      can set it up;
   3. if its address is not `predictRegistry(deployer)`, revert with
      `UnexpectedAddress(predicted, deployed)`;
   4. deploy `new WaterRota(registry)` (no salt) and record it with `registry.setRota(...)`;
   5. assign plot `i + 1` to `firstHolders[i]` for every holder, in order;
   6. call `registry.transferOwnership(council)`: with `Ownable2Step` the council becomes the
      owner only when it calls `acceptOwnership()`;
   7. `vm.stopBroadcast()`.

Do not use `msg.sender` inside `deploy`: when a test calls it, `msg.sender` is the test. Never
put a private key in the script: `forge script --account <name>` signs with a keystore made by
`cast wallet import`, and `run()` passes that account on as `msg.sender`.

**Worked example** (the visible test). With `deployer = makeAddr("deployer")`, a council and two
holders, `ana` and `ben`:

```solidity
DeployGarden script = new DeployGarden();
address predicted = script.predictRegistry(deployer);
(PlotRegistry registry, WaterRota rota) = script.deploy(deployer, council, holders);
// address(registry) == predicted, and code now lives there
// registry.owner() == deployer, registry.pendingOwner() == council
// registry.rota() == address(rota), rota.registry() == registry
// registry.holderOf(1) == ana, registry.holderOf(2) == ben
// after council calls acceptOwnership(): registry.owner() == council
```

Deploying again with the same deployer fails, because CREATE2 cannot create a contract where one
already exists.
