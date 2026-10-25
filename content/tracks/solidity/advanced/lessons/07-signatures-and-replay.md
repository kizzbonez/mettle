---
title: Signatures and Replay Attacks
summary: Verify signed messages safely. Learn what a signature proves, the traps in ecrecover, signing in tests with vm.sign and vm.addr, EIP-191 and EIP-712 typed data with OpenZeppelin, and how nonces, deadlines, the chain id and the contract's address stop a signature from being replayed.
minutes: 35
objectives:
  - Explain what a signature proves and write a test that signs with vm.sign and a key made by vm.addr
  - Avoid ecrecover's zero-address and malleability traps by using OpenZeppelin's ECDSA
  - Verify EIP-712 typed data with OpenZeppelin's EIP712 and a nonce, deadline and domain
  - Show a replay attack in a test and name the field that stops each kind of replay, including ERC-2612 permit
---

## Outline

1. What a signature proves
2. A signature that works forever
3. ecrecover's two traps
4. EIP-191 and EIP-712: what to sign
5. Nonces, deadlines and the domain
6. ERC-2612 permit

## What a signature proves

Every externally owned account has a **private key**, a 256-bit secret, and an address derived
from the matching public key. Signing a 32-byte **digest** (a hash of a message) with the key
gives a **signature** of three values, `v`, `r` and `s`. Anyone can then **recover** the
signer's address from the digest and the signature, without the key. A valid signature proves
one thing: the key's holder approved exactly this digest.

Signing happens off chain and costs nothing, so contracts accept signatures to let users approve
actions that someone else submits and pays for: vouchers, gasless approvals, orders, votes. A
signature is like a signed cheque: whoever holds it can present it. Unless the contract records
that it was cashed, it can be presented again; that is a **replay attack**.

## A signature that works forever

The owner of a tip jar signs "pay bob 1 ether"; `claim` checks the signature with the
**`ecrecover`** built-in and pays. In the test, `vm.addr(key)` turns a test key made in the test
into its address and `vm.sign(key, digest)` signs:

```solidity
function claim(address to, uint256 amount, uint8 v, bytes32 r, bytes32 s) external {
    bytes32 digest = MessageHashUtils.toEthSignedMessageHash(keccak256(abi.encode(to, amount)));
    if (ecrecover(digest, v, r, s) != owner) revert BadSignature();
    (bool ok,) = to.call{value: amount}("");
    if (!ok) revert PaymentFailed();
}

function test_one_signature_many_claims() public {
    uint256 ownerKey = uint256(keccak256("tip jar owner")); // a test key, made here
    address owner = vm.addr(ownerKey);
    address bob = makeAddr("bob");
    vm.deal(owner, 10 ether);
    vm.prank(owner);
    TipJar jar = new TipJar{value: 10 ether}();

    bytes32 digest = MessageHashUtils.toEthSignedMessageHash(keccak256(abi.encode(bob, 1 ether)));
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerKey, digest);
    for (uint256 i = 0; i < 10; i++) {
        jar.claim(bob, 1 ether, v, r, s); // anyone can resend the same signature
    }
    console.log("bob received", bob.balance / 1 ether, "ether from one 1-ether tip");
}
```

```text
[PASS] test_one_signature_many_claims() (gas: 794734)
Logs:
  bob received 10 ether from one 1-ether tip
```

The signature is visible to everyone in the first claim's transaction, so anyone can drain the
jar with it. Never put a real key in a test or a repository; derive test keys as above.

## ecrecover's two traps

```solidity
console.log("garbage recovers", ecrecover(digest, 27, bytes32(0), bytes32(0)));
(uint8 v, bytes32 r, bytes32 s) = vm.sign(key, digest);
uint8 v2 = v == 27 ? 28 : 27;
bytes32 s2 = bytes32(N - uint256(s)); // a second valid signature, made without the key
console.log("signer  ", vm.addr(key));
console.log("original", ecrecover(digest, v, r, s));
console.log("flipped ", ecrecover(digest, v2, r, s2));
ECDSA.recover(digest, v2, r, s2);
```

```text
[FAIL: ECDSAInvalidSignatureS(0xc3f92cce812dde4b536840dce001682e7d4665859d30c6a91b399f4ed33ce169)] test_ecrecover_traps() (gas: 30494)
Logs:
  garbage recovers 0x0000000000000000000000000000000000000000
  signer   0xCdF64Bf290FFAAabb562fCa398206d34981fD645
  original 0xCdF64Bf290FFAAabb562fCa398206d34981fD645
  flipped  0xCdF64Bf290FFAAabb562fCa398206d34981fD645
```

First, `ecrecover` does not revert on an invalid signature: it returns `address(0)`. If the
expected signer is ever zero (an initializer that never ran, a deleted role), garbage passes the
check. Second, signatures are **malleable**: from any valid `(v, r, s)`, anyone can compute a
twin `(v', r, N - s)`, where `N` is the curve's order, that recovers the same address. A
contract that marks "used" signatures by their bytes accepts the twin as new.

Use OpenZeppelin's **`ECDSA.recover`**: it reverts with `ECDSAInvalidSignature()` instead of
returning zero and rejects the "high `s`" twin with `ECDSAInvalidSignatureS`. And mark messages
as used by a nonce inside them, never by the signature.

## EIP-191 and EIP-712: what to sign

A signature over a bare hash is dangerous: the same 32 bytes might be a valid transaction or
another app's message. **EIP-191** prefixes signed data so it can never be a transaction.
`MessageHashUtils.toEthSignedMessageHash` adds the `"\x19Ethereum Signed Message:\n32"`
prefix that wallets use for `personal_sign`.

**EIP-712** signs **typed data**: wallets show the fields (`to`, `amount`, `deadline`) instead of
a hex blob, and the digest is `keccak256("\x19\x01" ‖ domainSeparator ‖ structHash)`. The
`structHash` hashes a **type hash**, the hash of a string such as
`Voucher(address to,uint256 amount,uint256 nonce,uint256 deadline)`, with the fields encoded by
`abi.encode`. The **domain separator** hashes the app's name and version, the **chain id** and
the verifying contract's address. OpenZeppelin's `EIP712` builds it, and rebuilds it if the
chain id changes:

```solidity
contract SafeTipJar is EIP712, Nonces {
    bytes32 public constant VOUCHER_TYPEHASH =
        keccak256("Voucher(address to,uint256 amount,uint256 nonce,uint256 deadline)");
    address public immutable owner;

    constructor() payable EIP712("SafeTipJar", "1") {
        owner = msg.sender;
    }

    function voucherDigest(address to, uint256 amount, uint256 nonce, uint256 deadline) public view returns (bytes32) {
        return _hashTypedDataV4(keccak256(abi.encode(VOUCHER_TYPEHASH, to, amount, nonce, deadline)));
    }

    function claim(address to, uint256 amount, uint256 nonce, uint256 deadline, bytes calldata signature) external {
        if (block.timestamp > deadline) revert Expired(deadline);
        address signer = ECDSA.recover(voucherDigest(to, amount, nonce, deadline), signature);
        if (signer != owner) revert InvalidSigner(signer);
        _useCheckedNonce(to, nonce); // reverts InvalidAccountNonce once it is used
        (bool ok,) = to.call{value: amount}("");
        if (!ok) revert PaymentFailed();
    }
}
```

## Nonces, deadlines and the domain

EIP-712 itself has no replay protection: each field you sign closes one door. The test signs one
voucher (`signature = abi.encodePacked(r, s, v)`) and tries three replays:

```text
[FAIL: Expired(86400 [8.64e4])] test_after_the_deadline() (gas: 47369)
[FAIL: InvalidSigner(0xCb578606e125e18E181EE77d6bCf52F05dE1457b)] test_replay_on_another_chain() (gas: 51555)
[FAIL: InvalidAccountNonce(0x1D96F2f6BeF1202E4Ce1Ff6Dad0c2CB002861d3e, 1)] test_replay_on_this_jar() (gas: 161156)
Logs:
  bob received 1
```

- The **nonce**, a number used once, stops a second claim on this contract. OpenZeppelin's
  `Nonces` keeps one counter per account; `_useCheckedNonce` requires the next one and counts up.
  Use it before the external call, so a reentrant `claim` cannot reuse it.
- The **deadline** limits how long an unsubmitted signature stays dangerous.
- The **chain id** stops replay on another network: after `vm.chainId(10)` the digest differs,
  so the signature recovers a stranger's address.
- The **verifying contract** stops replay on a second deployment that accepts the same message.
- Signing `to` stops a front-runner who copies the signature from redirecting the payment.

## ERC-2612 permit

**ERC-2612** adds `permit(owner, spender, value, deadline, v, r, s)` to ERC-20 tokens: an
EIP-712 signature sets an allowance, so a user can approve without a transaction of their own.
OpenZeppelin's `ERC20Permit` checks the deadline and uses the owner's nonce, exactly the
pattern above. Anyone can submit a permit, so a contract that calls `permit` and then
`transferFrom` should not fail when someone else submitted it first (check the allowance).

## Common mistakes

- **No nonce.** One signature paid 10 ether from a 1 ether tip. Put a nonce in the message.
- **Comparing `ecrecover` with a signer that may be zero.** Garbage recovers
  `0x0000000000000000000000000000000000000000`. Use `ECDSA.recover`, which reverts with
  `ECDSAInvalidSignature()`.
- **Marking signatures, not messages, as used.** The malleable twin is new bytes;
  `ECDSA.recover` rejects it with `ECDSAInvalidSignatureS(...)`.
- **A hand-made digest without chain id or contract address.** It is valid on every chain and
  every copy of the contract. Use `EIP712`.
- **`abi.encodePacked` in a struct hash.** Dynamic fields can collide (Medium 06); EIP-712 uses
  `abi.encode`.

## Practice

1. What does `ECDSA.recover` do with the garbage signature `(27, 0, 0)`?
2. In a test, let Alice sign an ERC-2612 permit for a shop to spend 2 TIX of an `ERC20Permit`
   token, submit it, then submit it again.
3. Which signed field stops each replay: the same voucher on this jar tomorrow, on a copy of the
   jar, on another chain?

### Answers

```solidity
function test_1_recover_rejects_garbage() public pure {
    ECDSA.recover(keccak256("pay bob 1 ether"), 27, bytes32(0), bytes32(0));
}

function test_2_permit() public {
    uint256 aliceKey = uint256(keccak256("alice"));
    address alice = vm.addr(aliceKey);
    address shop = makeAddr("shop");
    Ticket tix = new Ticket(); // ERC20, ERC20Permit("Ticket")
    tix.mint(alice, 5e18);

    bytes32 typehash =
        keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
    bytes32 structHash = keccak256(abi.encode(typehash, alice, shop, 2e18, tix.nonces(alice), 1 hours));
    bytes32 digest = keccak256(abi.encodePacked("\x19\x01", tix.DOMAIN_SEPARATOR(), structHash));
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(aliceKey, digest);

    tix.permit(alice, shop, 2e18, 1 hours, v, r, s); // anyone may submit it; alice pays no gas
    console.log("allowance", tix.allowance(alice, shop) / 1e18, "nonce", tix.nonces(alice));
    tix.permit(alice, shop, 2e18, 1 hours, v, r, s);
}
```

```text
[FAIL: ECDSAInvalidSignature()] test_1_recover_rejects_garbage() (gas: 4286)
[FAIL: ERC2612InvalidSigner(0xb4b9c339ED31Ab4F6115832E488eDA852Cf40290, 0x328809Bc894f92807417D2dAD6b7C998c1aFdac6)] test_2_permit() (gas: 1890692)
Logs:
  allowance 2 nonce 1
```

The second permit is hashed with nonce 1, so the old signature recovers a different address.
For 3: the nonce stops tomorrow's replay on this jar (the deadline also limits it), the
verifying contract in the domain stops the copy, and the chain id stops the other chain.

## Key takeaways

- A signature proves that a key approved one digest; it can be presented by anyone, again.
- `ecrecover` returns zero on failure and accepts malleable twins: use `ECDSA.recover`.
- Sign EIP-712 typed data with a domain (name, version, chain id, contract) via `EIP712`.
- Put a nonce and a deadline in every signed message, and use the nonce before any external call.
- In tests, make keys in the test and sign with `vm.sign`; `vm.addr` gives the signer's address.

## Further reading

- [EIP-712: Typed structured data hashing and signing](https://eips.ethereum.org/EIPS/eip-712)
- [ERC-2612: Permit Extension for EIP-20 Signed Approvals](https://eips.ethereum.org/EIPS/eip-2612)
- [Solidity documentation: Mathematical and Cryptographic Functions (ecrecover)](https://docs.soliditylang.org/en/latest/units-and-global-variables.html#mathematical-and-cryptographic-functions)
- [OpenZeppelin Contracts: Cryptography utilities](https://docs.openzeppelin.com/contracts/5.x/api/utils/cryptography)
