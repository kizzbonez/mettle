---
title: Deployment, Verification and Operations
summary: Deploy with one Foundry script to several networks, at deterministic CREATE2 addresses, verify the source, choose the EVM version a chain supports, hand ownership to a multisig, keep keys safe, and watch and defend a live contract with monitoring and an incident plan.
minutes: 40
objectives:
  - Write a deploy script that reads per-network settings, deploys with CREATE2 and checks the result
  - Explain what CREATE2 and the CREATE3 idea make an address depend on, and verify a contract with its constructor arguments
  - Choose evm_version for the chains you target, and name differences on layer 2 networks
  - Plan key management, monitoring and incident response for a live contract
---

## Outline

1. One script, several networks
2. Deterministic addresses: CREATE2 and CREATE3
3. Broadcasting and verifying
4. Layer 2 networks and the EVM version
5. Keys and ownership
6. Monitoring and incident response

## One script, several networks

Medium 12 introduced `forge script`. A production deploy script is a program you review like any
other code: it picks settings by `block.chainid`, deploys, and **checks what it deployed** before
anyone relies on it.

```solidity
contract Registry is Ownable {
    constructor(address owner_) Ownable(owner_) {}
}

contract DeployRegistry is Script {
    bytes32 constant SALT = keccak256("registry-v1");

    error UnsupportedChain(uint256 chainId);
    error WrongOwner(address owner);

    function multisigFor(uint256 chainId) internal pure returns (address) {
        if (chainId == 1) return 0x1111111111111111111111111111111111111111; // mainnet Safe
        if (chainId == 10) return 0x2222222222222222222222222222222222222222; // OP Mainnet Safe
        if (chainId == 31337) return 0x3333333333333333333333333333333333333333; // local chain
        revert UnsupportedChain(chainId);
    }

    function run() external returns (Registry registry) {
        address multisig = multisigFor(block.chainid);
        bytes memory initCode = abi.encodePacked(type(Registry).creationCode, abi.encode(multisig));
        address predicted = vm.computeCreate2Address(SALT, keccak256(initCode));

        vm.startBroadcast();
        registry = new Registry{salt: SALT}(multisig);
        vm.stopBroadcast();

        if (registry.owner() != multisig) revert WrongOwner(registry.owner());
        console.log("chain id:", block.chainid);
        console.log("registry:", address(registry));
        console.log("as predicted:", address(registry) == predicted);
        console.log("owner:", registry.owner());
        console.log("constructor arguments, for verification:");
        console.logBytes(abi.encode(multisig));
    }
}
```

Simulated with `forge script script/DeployRegistry.s.sol --chain 10 -vv`:

```text
== Logs ==
  chain id: 10
  registry: 0x9B5D5609dC500af4e04bD867d734424047Ceb77F
  as predicted: true
  owner: 0x2222222222222222222222222222222222222222
  constructor arguments, for verification:
  0x0000000000000000000000002222222222222222222222222222222222222222
```

With `--chain 8453`, which has no settings, it stops with `Error: script failed:
UnsupportedChain(8453)` instead of deploying with a wrong or empty setting. The owner is the
network's multisig from the constructor on, so the deployer key never holds power.

## Deterministic addresses: CREATE2 and CREATE3

A normal `CREATE` address depends on the deployer and its nonce, so it changes whenever another
transaction comes first. **CREATE2** (EIP-1014) computes `keccak256(0xff ++ deployer ++ salt ++
keccak256(initCode))[12:]`, and in scripts Foundry sends salted deployments through the standard
CREATE2 factory, which exists at the same address on most chains. Same factory, salt and init code
give the same address on every network: users and other contracts can know it in advance, and a test
can check it.

The init code includes the constructor arguments. The local run printed
`0xAd70F6F0147c8604B15b6D4b13c2C71777025f3f` with the local multisig as owner, OP Mainnet a
different address, because the owner differs. The **CREATE3** idea removes that dependency: CREATE2
deploys a tiny proxy whose address depends only on the factory and salt, and the proxy deploys the
real contract with plain `CREATE`. Libraries such as Solady and factories such as CreateX implement
it; whoever controls the salt controls the address, so good factories bind the salt to the caller.

## Broadcasting and verifying

Name the networks in `foundry.toml`, with secrets in environment variables:

```toml
[rpc_endpoints]
sepolia = "${SEPOLIA_RPC_URL}"
optimism = "${OPTIMISM_RPC_URL}"

[etherscan]
sepolia = { key = "${ETHERSCAN_API_KEY}" }
optimism = { key = "${ETHERSCAN_API_KEY}" }
```

```sh
forge script script/DeployRegistry.s.sol --rpc-url sepolia --account deployer --broadcast --verify
forge verify-contract 0x9B5D5609dC500af4e04bD867d734424047Ceb77F src/Registry.sol:Registry --chain optimism \
  --constructor-args 0x0000000000000000000000002222222222222222222222222222222222222222 --watch
```

Without `--broadcast` the script only simulates. Receipts land in `broadcast/<script>/<chain
id>/run-latest.json`. **Verification** uploads the source and compiler settings to an explorer
(Etherscan-style, Blockscout or Sourcify), which recompiles them and checks the bytecode matches, so
users can read what they call. It needs the same compiler version, optimizer and `evm_version`
settings and the ABI-encoded constructor arguments, which is why the script logs them. Verify every
contract, implementations behind proxies included.

## Layer 2 networks and the EVM version

Rollups run the EVM, with differences. On Arbitrum, `block.number` returns an approximate Ethereum
block number (`ArbSys(100).arbBlockNumber()` gives its own), so deadlines in blocks are wrong there:
use `block.timestamp`. OP Mainnet makes a block every 2 seconds, and OP Stack chains have no public
mempool and charge an L1 data fee on top of gas. Messages from L1 contracts arrive from an aliased
`msg.sender`. Read each chain's "differences from Ethereum" page before deploying.

Chains also adopt forks at different times. solc's `evm_version` (default `osaka`) decides which
opcodes it may emit: `shanghai` and later use `PUSH0`, `cancun` allows transient storage. Code built
for a newer EVM fails on an older one. This test runs three bytes of code, `PUSH0 PUSH0 RETURN`:

```solidity
function test_push0_needs_shanghai() public {
    address target = makeAddr("target");
    vm.etch(target, hex"5f5ff3"); // PUSH0, PUSH0, RETURN
    (bool ok,) = target.call("");
    console.log("call succeeded:", ok);
}
```

With the default EVM, then with `forge test --evm-version paris`:

```text
[PASS] test_push0_needs_shanghai() (gas: 30394)
Logs:
  call succeeded: true

[PASS] test_push0_needs_shanghai() (gas: 1056947573)
Logs:
  call succeeded: false
```

On `paris` the unknown opcode fails and burns all the gas it was given. Set `evm_version` in
`foundry.toml` to the oldest fork among your target chains, and test with it.

## Keys and ownership

A deployer key should deploy and nothing more. Keep keys in an encrypted keystore (`cast wallet
import deployer --interactive`, then `--account deployer`) or on a hardware wallet (`--ledger`),
never as `--private-key` in shell history, a `.env` file or a repository. Pass ownership and admin
roles to a multisig, behind a timelock where users need warning (lesson 07), and check on chain that
the transfer happened.

## Monitoring and incident response

Events are how you watch a live contract (Basic 09). Alert on every admin event
(`OwnershipTransferred`, `Upgraded`, `Paused`, role changes), on unusual amounts, and on invariants
such as "assets cover all shares", checked every block by an off-chain monitor or a forked Foundry
test run on a schedule.

Write the **incident response** plan before launch:

1. **Contain**: pause with the guardian, which needs no timelock.
2. **Assess**: reproduce the exploit as a Foundry test on a fork; find what is at risk.
3. **Fix**: patch, review, upgrade or migrate through the planned path.
4. **Communicate**: tell users what happened and what to do; contact SEAL 911 if you need
   responders.
5. **Learn**: publish a post-mortem.

## Common mistakes

- **The deployer stays owner.** One leaked laptop key then controls the protocol. Set the multisig
  in the constructor, as above.
- **Block-number deadlines on layer 2.** Arbitrum's `block.number` follows Ethereum's blocks;
  measure time in seconds.
- **The newest `evm_version` for an older chain.** As the `paris` run showed, `PUSH0` fails there.
- **Verification that fails.** Different optimizer settings or wrong constructor arguments give a
  bytecode mismatch; deploy and verify from the same build.

## Practice

1. Why did the local run and OP Mainnet get different addresses with the same salt?
2. Add Sepolia (chain id 11155111) to `multisigFor` with the multisig `0x4444...4444`.
3. A chain has not adopted Shanghai. Which `evm_version` do you set?

### Answers

```solidity
if (chainId == 11155111) return 0x4444444444444444444444444444444444444444; // Sepolia Safe
```

Simulated with `--chain 11155111`:

```text
== Logs ==
  chain id: 11155111
  registry: 0x238C6fEf64bCd84bcb59d31059b1Ea86E57E1c41
  as predicted: true
  owner: 0x4444444444444444444444444444444444444444
  constructor arguments, for verification:
  0x0000000000000000000000004444444444444444444444444444444444444444
```

1. The constructor argument (the owner) is part of the init code, so its hash, and the address,
   differ.
3. `paris` (the Merge fork), which emits no `PUSH0`; test with the same setting.

## Key takeaways

- A deploy script reads per-chain settings, refuses unknown chains and checks what it deployed.
- CREATE2 addresses depend on factory, salt and init code; CREATE3 drops the init code.
- Verify every contract with the exact build settings and constructor arguments.
- Match `evm_version` to your chains; keys deploy, multisigs own, monitors watch, plans are written
  first.

## Further reading

- [Foundry: Deploying with forge script](https://getfoundry.sh/forge/deploying)
- [Solidity: Setting the EVM version to target](https://docs.soliditylang.org/en/latest/using-the-compiler.html#setting-the-evm-version-to-target)
- [EIP-1014: Skinny CREATE2](https://eips.ethereum.org/EIPS/eip-1014)
- [Arbitrum: Block numbers and time](https://docs.arbitrum.io/build-decentralized-apps/arbitrum-vs-ethereum/block-numbers-and-time)
