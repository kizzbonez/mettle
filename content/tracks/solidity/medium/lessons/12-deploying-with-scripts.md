---
title: Deploying with Foundry Scripts
summary: Deploy with forge script and a Script contract, simulate locally, on anvil and against a testnet before broadcasting, pass constructor arguments from the environment, get the same address everywhere with CREATE2, test the script itself, verify the source, and keep keys out of files.
minutes: 40
objectives:
  - Write a Script contract whose run() deploys between vm.startBroadcast and vm.stopBroadcast, and say who sends each call
  - Simulate a script locally, then describe the steps to anvil and to a testnet with --rpc-url and --broadcast
  - Predict a CREATE2 address through forge's factory and check it in a test that runs the script
  - Sign deployments with a keystore or hardware wallet and verify the source on a block explorer
---

## Outline

1. From tests to a deployment
2. A first script: Script, run() and broadcasting
3. Simulate, then rehearse, then broadcast
4. Constructor arguments and configuration
5. The same address everywhere: CREATE2
6. Testing the script
7. Verifying the source
8. Keeping keys safe

## From tests to a deployment

Every contract so far lived only inside `forge test`. A **deployment** is a transaction that
creates the contract on a real network, signed by your key and paid for in gas, and it is
permanent. Deploying by hand, one command per contract, invites mistakes: a wrong constructor
argument, a forgotten configuration call, ownership left with a hot key. A **Foundry script**
writes the whole deployment in Solidity, so it can be reviewed, simulated and tested like any
other code.

## A first script: Script, run() and broadcasting

The contract to deploy takes two constructor arguments:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Tickets for the lantern festival, sold at a fixed price for the organiser.
contract LanternTickets {
    address public immutable organiser;
    uint256 public immutable price;
    mapping(address => uint256) public ticketsOf;

    error WrongPrice(uint256 sent);

    constructor(address organiser_, uint256 price_) {
        organiser = organiser_;
        price = price_;
    }

    function buy() external payable {
        if (msg.value != price) revert WrongPrice(msg.value);
        ticketsOf[msg.sender] += 1;
    }
}
```

A script lives in `script/` in a file ending in `.s.sol`, inherits forge-std's **`Script`**, and
`forge script` calls its `run()`. Only the calls between **`vm.startBroadcast()`** and
`vm.stopBroadcast()` become transactions; everything else (reading configuration, logging,
checks) runs only on your machine:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {LanternTickets} from "../src/LanternTickets.sol";

contract DeployLanterns is Script {
    bytes32 public constant SALT = keccak256("lantern-festival-v1");

    function run() external returns (LanternTickets tickets) {
        address organiser = vm.envAddress("ORGANISER");
        uint256 price = vm.envOr("PRICE", uint256(0.01 ether));

        vm.startBroadcast();
        tickets = new LanternTickets{salt: SALT}(organiser, price);
        vm.stopBroadcast();

        console.log("LanternTickets:", address(tickets));
        console.log("organiser:", tickets.organiser(), "price:", tickets.price());
    }
}
```

`ORGANISER=0x00000000000000000000000000000000000f00D5 forge script script/DeployLanterns.s.sol`
runs it on a local, empty EVM:

```text
Script ran successfully.
Gas used: 320971

== Return ==
tickets: contract LanternTickets 0xC5A06Cb18493a053f503904B3bE4F0322D5a7cE7

== Logs ==
  LanternTickets: 0xC5A06Cb18493a053f503904B3bE4F0322D5a7cE7
  organiser: 0x00000000000000000000000000000000000f00D5 price: 10000000000000000

If you wish to simulate on-chain transactions pass a RPC URL.
```

`vm.startBroadcast()` with no argument sends from the account you give on the command line;
`vm.startBroadcast(deployer)` names it. Broadcasting changes the sender of the calls the script
makes, not `msg.sender` inside the script, so pass owners to constructors explicitly.

## Simulate, then rehearse, then broadcast

A deployment goes through three runs of the same command:

- **Locally**, as above: no network, nothing sent. This is all the lab sandbox can do.
- **Against a node**, with `--rpc-url <url>`: forge replays the script on the chain's real
  state and estimates gas, still sending nothing. **anvil**, Foundry's local node, serves a chain
  at `http://127.0.0.1:8545` with ten funded development accounts; a public **testnet** such as
  Sepolia, the recommended one for applications, behaves like mainnet with ether from a
  **faucet**, a website that gives free test ether.
- **For real**, with `--broadcast` added: forge signs and sends the transactions, waits for
  receipts and records them in `broadcast/DeployLanterns.s.sol/<chain id>/run-latest.json`, where
  later scripts can read the addresses. `--resume` continues a broadcast that stopped half way.

## Constructor arguments and configuration

Never hard-code what differs between networks. `vm.envAddress`, `vm.envUint` and `vm.envOr`
(with a default) read environment variables, so one reviewed script serves every chain. A
missing variable stops the script before anything is sent:

```text
Error: script failed: vm.envAddress: environment variable "ORGANISER" not found
```

## The same address everywhere: CREATE2

A normal deployment's address comes from the sender and its nonce, so it usually differs between chains.
With a salt, **CREATE2** (EIP-1014, met in Medium 01) gives
`keccak256(0xff ++ creator ++ salt ++ keccak256(initCode))`, keeping the last 20 bytes. The
**init code** is the creation code followed by the ABI-encoded constructor arguments, so a
different price gives a different address. Under a broadcast, forge sends every salted `new`
through the **CREATE2 factory** at `0x4e59b44847b379578588920cA78FbF26c0B4956C`, deployed on
most chains, so the factory is the creator. The trace with `-vvvv` shows it:

```text
    ├─ [0] VM::startBroadcast()
    │   └─ ← [Return]
    ├─ [247407] Create2Deployer::create2()
    │   ├─ [175441] → new LanternTickets@0xC5A06Cb18493a053f503904B3bE4F0322D5a7cE7
    │   │   └─ ← [Return] 873 bytes of code
```

The same init code then lands at the same address on every chain, provided the compiler
version and settings are identical (pin `solc` and the optimizer). Deploying it twice fails,
because CREATE2 cannot create where code already exists.

## Testing the script

A script is a contract, so a test can deploy it and call `run()`, with `vm.setEnv` for its
configuration, and check every promise it makes:

```solidity
contract DeployLanternsTest is Test {
    function test_DeploysAtThePredictedAddress() public {
        address organiser = makeAddr("organiser");
        vm.setEnv("ORGANISER", vm.toString(organiser));
        DeployLanterns script = new DeployLanterns();

        bytes memory initCode =
            abi.encodePacked(type(LanternTickets).creationCode, abi.encode(organiser, uint256(0.01 ether)));
        address predicted = vm.computeCreate2Address(script.SALT(), keccak256(initCode), CREATE2_FACTORY);

        LanternTickets tickets = script.run();
        assertEq(address(tickets), predicted, "the address compared with the CREATE2 prediction");
        assertEq(tickets.organiser(), organiser, "the organiser");
    }
}
```

```text
[PASS] test_DeploysAtThePredictedAddress() (gas: 1247769)
Logs:
  LanternTickets: 0x34A3B8F0c74C12EfE4D6BbCdA9D8D84177401dC9
  organiser: 0xe81f335f0c35d66819c4dF203d728f579880b4b1 price: 10000000000000000
```

## Verifying the source

On a block explorer a contract is only bytecode until you **verify** it: you upload the source
and compiler settings, the explorer recompiles them and, if the bytecode matches, publishes the
source and ABI so that users can read what they are trusting. Add `--verify` (with an explorer
API key) to the broadcasting command, or run `forge verify-contract` afterwards. Unverified
contracts deserve suspicion; yours should never be one.

## Keeping keys safe

Whoever holds the deployer's key can do whatever the deployer can. Never write a private key in a
script, a `.env` file or a repository: bots scan public repositories for keys all the time.
`cast wallet import deployer --interactive` stores the key encrypted in `~/.foundry/keystores`,
and `forge script ... --account deployer` asks for its password when it signs; `--ledger` signs
with a hardware wallet, which mainnet deserves. Use anvil's well-known keys only on anvil, and
hand ownership to a multisig (Professional 09) as the script's last step.

## Common mistakes

- **Using `address(this)` in a script.** `forge script` stops with ``Usage of `address(this)`
  detected in script contract. Script contracts are ephemeral and their addresses should not be
  relied upon.`` The script is never deployed; pass real addresses in.
- **`msg.sender` in a constructor deployed with a salt.** It is the factory: a contract that
  stores `msg.sender` in its constructor logged `salted deployer: 0x4e59b44847b379578588920cA78FbF26c0B4956C`. Take
  the owner as a constructor argument.
- **Predicting with the wrong creator or init code.** Using the script's address instead of
  `CREATE2_FACTORY`, or hashing `creationCode` without the arguments, predicts an address where
  nothing will ever be. Compare the prediction with the deployment in a test.
- **A key in `.env`.** It ends up in a commit or a log. Use a keystore with `--account`.

## Practice

1. Run the script with `PRICE=20000000000000000`. Is the address the same?
2. Write a test that `run()` refuses to deploy without `ORGANISER`.
3. Write the command that deploys to Sepolia with the keystore account `festival` and verifies.

### Answers

1. No: the price is part of the init code.

   ```text
     LanternTickets: 0x13ADb8D094546F5f67BB1fE260A22C990627a336
     organiser: 0x00000000000000000000000000000000000f00D5 price: 20000000000000000
   ```

2. ```solidity
   function test_RevertWhen_OrganiserIsMissing() public {
       DeployLanterns script = new DeployLanterns();
       vm.expectRevert(bytes("vm.envAddress: environment variable \"ORGANISER\" not found"));
       script.run();
   }
   ```

   ```text
   [PASS] test_RevertWhen_OrganiserIsMissing() (gas: 984820)
   ```

3. `ORGANISER=0x... forge script script/DeployLanterns.s.sol --rpc-url $SEPOLIA_RPC_URL
   --account festival --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY`, after a run
   without `--broadcast` against the same URL.

## Key takeaways

- A script is reviewed, simulated and tested Solidity; only the calls inside a broadcast are sent.
- Simulate locally, rehearse with `--rpc-url`, then add `--broadcast`.
- Read configuration from the environment; pass owners explicitly.
- CREATE2 through forge's factory gives one address on every chain for identical init code;
  prove the prediction in a test.
- Verify every contract, and keep keys in keystores or hardware wallets, never in files.

## Further reading

- [Foundry: Scripting](https://www.getfoundry.sh/forge/scripting)
- [Foundry: Deterministic deployments using CREATE2](https://getfoundry.sh/guides/deterministic-deployments-using-create2)
- [Foundry: Key management](https://www.getfoundry.sh/guides/best-practices/key-management)
- [EIP-1014: Skinny CREATE2](https://eips.ethereum.org/EIPS/eip-1014)
