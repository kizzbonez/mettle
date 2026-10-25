The buoy network's apps need to know the registry's address before it exists, and the same
address on every network. `BuoyRegistry` is written for you: it has no constructor arguments, so
its init code is identical everywhere, and only the contract that deployed it can set its owner,
once, with `initialize`. Complete `BuoyDeployer`:

1. **`function multisigFor(uint256 chainId) public pure returns (address)`** returns the owner
   for each network, and reverts with `UnsupportedChain(chainId)` for any other:

   | Network | Chain id | Multisig |
   | --- | --- | --- |
   | Ethereum mainnet | 1 | `0x1111111111111111111111111111111111111111` |
   | OP Mainnet | 10 | `0x2222222222222222222222222222222222222222` |
   | Arbitrum One | 42161 | `0x3333333333333333333333333333333333333333` |

2. **`function predict(bytes32 salt) public view returns (address)`** returns the address that
   CREATE2 gives a `BuoyRegistry` deployed by this contract with `salt`: the last 20 bytes of
   `keccak256(abi.encodePacked(bytes1(0xff), address(this), salt, keccak256(initCode)))`, where
   the init code is `type(BuoyRegistry).creationCode`.
3. **`function deploy(bytes32 salt) external returns (BuoyRegistry registry)`**, in this order:
   - looks up the current network's multisig with `multisigFor(block.chainid)` (so an unknown
     network reverts with `UnsupportedChain`);
   - if the predicted address already has code, reverts with `AlreadyDeployed(predicted)`;
   - deploys with `new BuoyRegistry{salt: salt}()` and calls `initialize(multisig)` on it in the
     same transaction, so nobody can claim it in between;
   - checks the new address against the prediction, reverting with
     `DeploymentMismatch(expected, actual)` if they differ;
   - emits `RegistryDeployed(block.chainid, address(registry), multisig)`.

```solidity
BuoyDeployer factory = new BuoyDeployer();
vm.chainId(10);                                  // pretend to be OP Mainnet
address predicted = factory.predict(salt);       // the same on chains 1, 10 and 42161
BuoyRegistry registry = factory.deploy(salt);    // emits RegistryDeployed(10, predicted, 0x2222...2222)
registry.owner();                                // 0x2222222222222222222222222222222222222222
factory.deploy(salt);                            // reverts with AlreadyDeployed(predicted)
```
