---
title: Digital Signatures and PKI
summary: Prove who wrote something and that it has not changed (SY0-801 objective 1.3). Sign and verify with ECDSA and Ed25519, see how signatures give non-repudiation, learn what a public key infrastructure does, and manage keys through their life cycle, including storage, rotation, revocation and key escrow.
minutes: 35
objectives:
  - Sign and verify data with OpenSSL and Python, and explain what a valid signature proves
  - Explain how digital signatures provide integrity, authentication and non-repudiation
  - Describe the parts of a public key infrastructure and why it is needed
  - Apply the key management life cycle, and say when key escrow is appropriate
---

## Outline

1. How a digital signature works
2. Signing a release manifest
3. What a signature proves
4. Public key infrastructure
5. Managing keys through their life
6. Key escrow

This lesson covers the digital signatures, public key infrastructure (PKI) and key escrow
bullets of SY0-801 objective 1.3, and finishes the non-repudiation story from lesson 1.

## How a digital signature works

A **digital signature** reverses the roles of the keys from lesson 7. The signer computes a hash
of the message (lesson 5) and transforms that digest with their **private key**. Anyone with the
matching **public key** can check that the signature fits this exact message. Only the holder of
the private key could have produced it, and changing a single bit of the message makes the check
fail.

NIST FIPS 186-5, the Digital Signature Standard, approves three families:

- **RSA** signatures, with PSS (Probabilistic Signature Scheme) or PKCS #1 v1.5 padding;
- **ECDSA** (Elliptic Curve Digital Signature Algorithm), for example on P-256;
- **EdDSA** (Edwards-curve Digital Signature Algorithm), usually **Ed25519**, which is fast and
  hard to get wrong.

The old DSA is no longer approved for creating new signatures. For the quantum future, NIST has
published ML-DSA (FIPS 204) and SLH-DSA (FIPS 205).

## Signing a release manifest

Lesson 5 left a gap: a checksum manifest proves nothing if an attacker can replace it too. The
fix is to sign the manifest. The publisher signs once with a private key; every customer verifies
with the public key they obtained earlier from a trusted place:

```console
$ openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out release-signing.key
$ openssl pkey -in release-signing.key -pubout -out release-signing.pub
$ openssl dgst -sha256 -sign release-signing.key -out SHA256SUMS.sig SHA256SUMS
$ wc -c SHA256SUMS.sig
71 SHA256SUMS.sig
$ openssl dgst -sha256 -verify release-signing.pub -signature SHA256SUMS.sig SHA256SUMS
Verified OK
$ sed -i 's/^6d77/0000/' SHA256SUMS
$ openssl dgst -sha256 -verify release-signing.pub -signature SHA256SUMS.sig SHA256SUMS
Verification failure
$ echo $?
1
```

An attacker who swaps the installer and rewrites `SHA256SUMS` to match cannot produce a new
signature without the private key, so the verification fails. Linux distributions sign their
package repositories this way, and code signing works on the same principle.

The same in Python, with Ed25519 signing a purchase approval:

```python
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

approver_key = Ed25519PrivateKey.generate()          # stays with the finance director
approver_public = approver_key.public_key()          # published to everyone who checks

order = b"PO-7731 approve 12 defibrillator batteries, total 4,180.00"
signature = approver_key.sign(order)
print("signature bytes:", len(signature))


def check(public_key, message, sig):
    try:
        public_key.verify(sig, message)
        return "valid"
    except InvalidSignature:
        return "INVALID"


print("original order:", check(approver_public, order, signature))
print("total changed: ", check(approver_public, order.replace(b"4,180", b"9,180"), signature))
someone_else = Ed25519PrivateKey.generate().public_key()
print("other person's key:", check(someone_else, order, signature))
```

```text
signature bytes: 64
original order: valid
total changed:  INVALID
other person's key: INVALID
```

## What a signature proves

A valid signature gives three things at once:

- **Integrity**: the message is exactly what was signed.
- **Authentication of origin**: it was signed with this particular private key.
- **Non-repudiation**: because only the director holds the private key, she cannot credibly deny
  approving PO-7731. Compare HMAC from lesson 5: both sides share an HMAC key, so either could have
  made a tag, and an HMAC gives no non-repudiation.

Notice what is missing: the signature proves *which key* signed, not *which person*. If someone
hands you a public key labeled "finance director", how do you know it is hers and not an
attacker's? Binding public keys to real identities is the job of a PKI.

## Public key infrastructure

A **public key infrastructure** (PKI) is the set of roles, policies, procedures, hardware and
software that creates, distributes, stores and revokes digital certificates. Its parts:

- A **certificate** is a signed document that says "this public key belongs to this name". The
  standard format is X.509.
- A **certificate authority** (CA) checks identities and signs certificates. Trusting the CA's
  public key lets you trust every certificate it signs.
- A **registration authority** (RA) performs the identity checks for the CA in larger PKIs.
- **Repositories and revocation services** publish certificates and the list of those revoked
  before their expiry date.
- **Policies** (a certificate policy and a certification practice statement) say how the CA
  checks identities and protects its own keys.

Public CAs issue the certificates websites use; organizations also run **private** (internal) PKIs
for VPNs, Wi-Fi, device and smart-card authentication. Lesson 9 opens up certificates themselves:
chains, the root of trust, signing requests and revocation.

## Managing keys through their life

Cryptography is only as strong as the handling of its keys. NIST SP 800-57 describes a life
cycle:

1. **Generation** with a cryptographically secure random source, ideally inside the device that
   will use the key (a smart card, a hardware security module) so the private key never exists
   anywhere else.
2. **Distribution** of public keys through certificates; secret keys only over protected
   channels or wrapped (lesson 7).
3. **Storage** with the strongest protection available: hardware modules, or at least an
   encrypted file readable only by its owner.
4. **Use** for one purpose only: a signing key does not also decrypt.
5. **Rotation** at the end of the **cryptoperiod**, the time a key is authorized for use. SP
   800-57 suggests one to three years for a private signing key, and replacement immediately if
   compromise is suspected.
6. **Revocation** when a key is lost, stolen or no longer needed, so others stop trusting it.
7. **Destruction** of private and secret keys once nothing needs them, or archiving where old data
   must still be decrypted.

Storage in practice, for a key that must live in a file:

```console
$ openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -aes-256-cbc -pass pass:'correct-horse-ward-7' -out signing.key
$ chmod 600 signing.key
$ head -1 signing.key
-----BEGIN ENCRYPTED PRIVATE KEY-----
$ ls -l signing.key
-rw------- 1 sandbox sandbox 399 Oct 15 16:51 signing.key
$ openssl pkey -in signing.key -passin pass:wrong -noout 2>&1 | head -1
Could not read key from signing.key
```

The key is encrypted with a passphrase and readable only by its owner. (Typing a passphrase on the
command line puts it in the shell history; real scripts read it from a protected file or a
secrets manager.)

## Key escrow

**Key escrow** means a trusted third party, or a protected internal system, keeps a copy of a
private or secret key so that encrypted data can be recovered if the owner's copy is lost. Common
examples: BitLocker recovery keys stored in the organization's directory, and an encryption key
for a departing employee's mailbox held by IT. Escrow is appropriate for **encryption** keys,
where losing the key means losing the data. It is wrong for **signing** keys: if someone else
holds a copy, the owner can deny signing, and non-repudiation is gone. The escrow store is itself
a high-value target, so it needs strong access control, logging and, ideally, approval by two
people before a key is released.

## Common mistakes

- **Verifying with a public key that came with the download.** An attacker who controls the
  download supplies their own key; get it from a trusted source in advance.
- **Ignoring the exit status of a verification** in an install script.
- **Escrowing signing keys** or sharing one signing key among several people, which destroys
  non-repudiation.
- **Keys with no owner, inventory or expiry,** so nobody rotates them and nobody knows what breaks
  when one leaks.
- **Unencrypted private keys in backups, repositories or home directories.**

## Practice

1. A tampered `SHA256SUMS` fails verification. Which key did the attacker need, and why could they
   not get past the check with the public key alone?
2. Why does an HMAC tag not give non-repudiation, while a signature does?
3. Which PKI component vouches that a public key belongs to `payroll.example.test`?
4. Your company wants to recover encrypted files if an employee forgets their password. Which keys
   may be escrowed, and which must not be?

### Answers

1. The publisher's private signing key. The public key can only verify signatures, never create
   them.
2. Both parties hold the same HMAC key, so either could have made the tag; only the signer holds
   the private signing key.
3. A certificate authority, by signing a certificate for that name.
4. The file encryption keys may be escrowed. Signing keys must not be, or signed records lose
   non-repudiation.

## Key takeaways

- A signature is a hash transformed with a private key and checked with the public key; use
  ECDSA, EdDSA or RSA (FIPS 186-5).
- Signatures give integrity, authentication of origin and non-repudiation; HMAC does not give
  non-repudiation.
- A PKI binds public keys to identities through CA-signed certificates.
- Manage keys through generation, storage, single use, rotation, revocation and destruction.
- Escrow encryption keys for recovery, never signing keys.

## Further reading

- [NIST FIPS 186-5, Digital Signature Standard](https://csrc.nist.gov/pubs/fips/186-5/final)
- [NIST SP 800-57 Part 1 Rev. 5, Recommendation for Key Management](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final)
- [NIST CSRC glossary: key escrow](https://csrc.nist.gov/glossary/term/key_escrow)
- [cryptography documentation: Ed25519 signing](https://cryptography.io/en/latest/hazmat/primitives/asymmetric/ed25519/)
