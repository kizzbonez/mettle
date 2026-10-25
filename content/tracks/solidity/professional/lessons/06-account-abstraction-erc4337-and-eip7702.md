---
title: "Account Abstraction: ERC-4337 and EIP-7702"
summary: Learn why externally owned accounts are limited, how ERC-4337 runs smart accounts through user operations, bundlers, the EntryPoint and paymasters, how EIP-7702 lets an EOA delegate to contract code, what that breaks, and how to write and test a smart account's validation.
minutes: 40
objectives:
  - Explain what a UserOperation, a bundler, the EntryPoint and a paymaster each do in ERC-4337
  - Write a validateUserOp that checks its caller and the signature, returns 0 or 1 instead of reverting, and pays the prefund
  - Explain what an EIP-7702 authorization writes to an EOA and protect a delegate contract from outside callers
  - Find code that EIP-7702 breaks and test delegation with vm.signDelegation and vm.attachDelegation
---

## Outline

1. What an EOA cannot do
2. ERC-4337: user operations, bundlers and the EntryPoint
3. Writing a validation function
4. Paymasters and validation rules
5. EIP-7702: code for an existing EOA
6. What EIP-7702 breaks

## What an EOA cannot do

An **externally owned account** (EOA, Basic 01) follows rules fixed in the protocol: one secp256k1
key signs every transaction, the account pays gas in ether, each transaction makes one call, and a
lost or stolen key is final. **Account abstraction** means letting code decide what makes an
account's action valid, so that rules such as two signers, a daily limit, a passkey or a recovery
contact become possible.

A **smart contract wallet** is a contract that holds the assets and checks authorisation itself; the
Safe multisig (lesson 07) is the best known. Until 2023 it had one weakness: a contract cannot start
a transaction, so its owners still needed an EOA holding ether to call it.

## ERC-4337: user operations, bundlers and the EntryPoint

**ERC-4337**, live on mainnet since March 2023, removes that need without changing the protocol. The
user signs a **UserOperation**: `sender` (the smart account), `nonce`, `callData` (what the account
should do), gas limits and fees, an optional `initCode` that deploys the account on first use,
optional paymaster data, and a `signature` whose format the account defines.

User operations go to a separate mempool watched by **bundlers**, which pack many of them into one
ordinary transaction calling `handleOps` on the **EntryPoint**, a single audited contract per chain
(OpenZeppelin 5.7's `Account` uses version 0.9, at `0x433709009B8330FDa32311DF1C2AFA402eD8D009`).
The EntryPoint runs two loops. The **validation phase** calls `validateUserOp` on each account and
makes sure each can pay; the **execution phase** calls each account with its `callData`, refunds
unused gas and pays the bundler. The `userOpHash` it passes covers the operation, the EntryPoint's
address and the chain id, so a signature cannot be replayed elsewhere (Advanced 07).

## Writing a validation function

```solidity
contract TinyAccount {
    address public immutable entryPoint;
    address public immutable owner;

    error NotEntryPoint(address caller);
    error PrefundFailed();

    constructor(address entryPoint_, address owner_) {
        entryPoint = entryPoint_;
        owner = owner_;
    }

    /// @notice Called by the EntryPoint before it runs `userOp.callData` on this account.
    /// @return validationData 0 if the owner signed `userOpHash`, 1 if not.
    function validateUserOp(PackedUserOperation calldata userOp, bytes32 userOpHash, uint256 missingAccountFunds)
        external
        returns (uint256 validationData)
    {
        if (msg.sender != entryPoint) revert NotEntryPoint(msg.sender);
        (address signer, ECDSA.RecoverError err,) = ECDSA.tryRecover(userOpHash, userOp.signature);
        validationData = (err == ECDSA.RecoverError.NoError && signer == owner) ? 0 : 1;
        if (missingAccountFunds > 0) {
            (bool ok,) = payable(msg.sender).call{value: missingAccountFunds}("");
            if (!ok) revert PrefundFailed();
        }
    }
}
```

`PackedUserOperation` comes from `@openzeppelin/contracts/interfaces/IERC4337.sol`. A test pranks as
the EntryPoint, signs with `vm.sign`, and calls it three times:

```text
[PASS] test_validation() (gas: 646692)
Logs:
  owner's signature: 0
  prefund received: 10000000000000000
  mallory's signature: 1
```

Three rules make this correct. Only the EntryPoint may call it, or anyone could pull the prefund. A
wrong signature **returns 1** (`SIG_VALIDATION_FAILED`) instead of reverting, as the standard asks,
so that wallets can estimate gas with a placeholder signature; any other problem reverts. And
`missingAccountFunds` is paid to the EntryPoint: the account's deposit for this operation's gas. The
return value can also carry 48-bit `validUntil` and `validAfter` timestamps in its upper bits. In
production, inherit OpenZeppelin's `Account` with a signer such as `SignerECDSA`.

## Paymasters and validation rules

A **paymaster** is a contract that pays an operation's gas: its `validatePaymasterUserOp` runs in
the validation phase (checking a sponsor's signature, say) and `postOp` after execution, where it
could charge the user in an ERC-20.

Bundlers simulate validation before they accept an operation, and pay for the whole bundle, so
validation must not pass in simulation and fail on chain. **ERC-7562** sets the rules: validation
may not use opcodes such as `TIMESTAMP`, `NUMBER`, `BLOCKHASH`, `ORIGIN` or `GASPRICE`, and may
touch only storage associated with the account, unless the entity is staked. Express time limits
through `validUntil`, not `block.timestamp`.

## EIP-7702: code for an existing EOA

**EIP-7702**, in the Pectra upgrade of 7 May 2025, adds transaction type 4 with an **authorization
list**. Each authorization, signed by an EOA (the **authority**), names a chain id (0 means every
chain), a contract address and the EOA's current nonce. The EVM then writes a 23-byte **delegation
indicator**, `0xef0100` followed by that address, into the EOA's code. From then on any call to the
EOA runs the delegate's code **in the EOA's context**: its storage, its balance, `address(this)`
being the EOA. Delegating to `address(0)` clears it. The key still works as before.

```solidity
/// @notice Code that EOAs delegate to with EIP-7702. It runs in the EOA's own context.
contract BatchDelegate {
    struct Call {
        address to;
        uint256 value;
        bytes data;
    }

    error NotSelf(address caller);
    error CallFailed(uint256 index);

    /// @notice Runs several calls in one transaction. Only the account itself may ask.
    function execute(Call[] calldata calls) external payable {
        if (msg.sender != address(this)) revert NotSelf(msg.sender);
        for (uint256 i = 0; i < calls.length; i++) {
            (bool ok,) = calls[i].to.call{value: calls[i].value}(calls[i].data);
            if (!ok) revert CallFailed(i);
        }
    }
}
```

In a test, `vm.signDelegation(impl, key)` signs an authorization and `vm.attachDelegation(auth)`
makes the next call a type 4 transaction carrying it (`vm.signAndAttachDelegation` does both). Alice
pays a baker and a florist in one transaction sent to herself:

```text
  code size before: 0
  authorization nonce: 0
  code size after: 23
  0xef01005615deb798bb3e4dfa0139dfa1b3d433cc23b72f
  alice's balance: 500000000000000000
```

The final check, Mallory calling `BatchDelegate(alice).execute`, reverts with `NotSelf(mallory)`. A
delegate has no constructor run for each EOA, so keep it stateless where you can (the authority is
`address(this)`, as in OpenZeppelin's `SignerEIP7702`); an `initialize` function can be front-run
unless the EOA signs its arguments. Storage stays when an EOA switches delegates, so use ERC-7201
namespaces (Advanced 08).

## What EIP-7702 breaks

Older contracts used `msg.sender == tx.origin` to mean "a person, one call per transaction", and
`code.length == 0` to mean "an EOA". Neither holds now:

```solidity
contract TicketBooth {
    mapping(address => uint256) public tickets;

    error NoContracts();

    function buy() external {
        if (msg.sender != tx.origin) revert NoContracts();
        tickets[msg.sender] += 1;
    }
}
```

Alice batches three `buy()` calls through her delegate with `vm.prank(alice, alice)`:

```text
  tickets bought in one transaction: 3
  alice.code.length == 0: false
```

Write the rule you mean (`tickets[msg.sender] == 0`), never "no code".

## Common mistakes

- **A delegate without a caller check.** Remove `NotSelf` and anyone can spend the EOA's funds:
  Mallory's batch sent herself Alice's ether (`mallory's balance: 1000000000000000000`). Check
  `msg.sender == address(this)`, or a signature over a nonce.
- **Assuming a delegated EOA still accepts what an EOA accepts.** Every call now runs the delegate.
  `BatchDelegate` has no `receive()`, so a plain ether payment to Alice returns `ok == false`, and
  `_safeMint` to her fails with `ERC721InvalidReceiver(0x328809Bc894f92807417D2dAD6b7C998c1aFdac6)`.
  Give delegates `receive()`, `ERC721Holder` and `ERC1155Holder`.
- **Reverting on a bad signature in `validateUserOp`.** Return 1; revert only for other errors.
- **Signing your own authorization with the current nonce.** The authorization list is processed
  after the sender's nonce goes up, so when the authority sends the transaction itself, sign with
  nonce + 1 (`vm.signDelegation` has a nonce overload; `vm.prank` does not raise the sender nonce, a
  real transaction does).

## Practice

1. Change `TicketBooth` so that each address can hold one ticket, without `tx.origin`.
2. Write `delegateOf(address)`, returning an account's EIP-7702 delegate or `address(0)`.
3. What happens to a batch whose second call reverts?

### Answers

```solidity
function buy() external {
    if (tickets[msg.sender] != 0) revert AlreadyHasTicket(msg.sender);
    tickets[msg.sender] = 1;
}

function delegateOf(address account) view returns (address) {
    bytes23 code = bytes23(account.code);
    if (account.code.length != 23 || bytes3(code) != 0xef0100) return address(0);
    return address(bytes20(code << 24));
}
```

Alice's batch of two `buy()` calls:

```text
  delegate before: 0x0000000000000000000000000000000000000000
  0x3f9a3b480000000000000000000000000000000000000000000000000000000000000001
  delegate after: 0x2e234DAe75C793f67A35089C9d99245E1C58470b impl: 0x2e234DAe75C793f67A35089C9d99245E1C58470b
  tickets: 0
```

The batch reverts with `CallFailed(1)` (selector `0x3f9a3b48`), and the first purchase is undone
with it.

## Key takeaways

- ERC-4337: bundlers send user operations to the EntryPoint, which validates each account, then
  executes.
- `validateUserOp`: only the EntryPoint, return 1 for a bad signature, pay `missingAccountFunds`.
- EIP-7702 writes `0xef0100 || delegate` into an EOA; its calls run the delegate in the EOA's
  context.
- Protect every delegate entry point; `tx.origin` and `code.length` no longer identify people.

## Further reading

- [EIP-7702: Set Code for EOAs](https://eips.ethereum.org/EIPS/eip-7702)
- [ERC-4337: Account Abstraction Using Alt Mempool](https://eips.ethereum.org/EIPS/eip-4337)
- [OpenZeppelin Contracts: Smart Accounts](https://docs.openzeppelin.com/contracts/5.x/accounts)
- [Foundry: signDelegation cheatcodes](https://getfoundry.sh/reference/cheatcodes/sign-delegation)
