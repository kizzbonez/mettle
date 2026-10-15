---
title: Asymmetric Encryption and Key Exchange
summary: How two strangers agree on a secret over a hostile network (SY0-801 objective 1.3). Learn public and private keys, RSA and elliptic-curve cryptography with current key sizes, hybrid encryption, Diffie-Hellman and ECDHE key exchange, forward secrecy, and the move to post-quantum algorithms, generating real keys with OpenSSL and Python.
minutes: 35
objectives:
  - Explain what the public and private key of a pair are used for
  - Choose RSA or elliptic-curve key sizes that meet current NIST guidance
  - Describe hybrid encryption and wrap a symmetric key with RSA-OAEP
  - Explain Diffie-Hellman key exchange, ECDHE and forward secrecy, and why exchanges need authentication
---

## Outline

1. A pair of keys
2. RSA and elliptic curves
3. Hybrid encryption
4. Key exchange: Diffie-Hellman
5. Forward secrecy and transport encryption
6. Quantum computers and what comes next

This lesson covers the asymmetric encryption, public and private key, key exchange, key length
and transport/communication encryption bullets of SY0-801 objective 1.3.

## A pair of keys

Lesson 6 ended with a problem: symmetric encryption needs both sides to share a key first.
**Asymmetric** (public-key) cryptography uses a **key pair** generated together:

- The **public key** can be given to anyone: published on a website, sent by email, embedded in a
  certificate.
- The **private key** is kept secret by its owner and never leaves their control.

What one key does, only the other can undo. Anyone can **encrypt** with your public key, and
only your private key decrypts. You can **sign** with your private key, and anyone can verify
with your public key (lesson 8). Deriving the private key from the public key is a hard
mathematical problem, so publishing the public key is safe.

## RSA and elliptic curves

**RSA** (Rivest, Shamir, Adleman) rests on the difficulty of factoring a huge number, the
**modulus**, into its two prime factors. **Elliptic-curve cryptography** (ECC) rests on a
different problem on points of a curve and gets the same strength from much smaller keys. NIST
SP 800-57 compares them by security strength:

| Security strength | Symmetric | RSA modulus | Elliptic curve |
| --- | --- | --- | --- |
| 112 bits (current minimum) | (3DES, retired) | 2048 bits | 224 bits |
| 128 bits | AES-128 | 3072 bits | 256 bits (P-256, Curve25519) |
| 192 bits | AES-192 | 7680 bits | 384 bits (P-384) |
| 256 bits | AES-256 | 15360 bits | 512 bits and more (P-521) |

RSA keys below 2048 bits are disallowed for new signatures and key establishment (NIST SP
800-131A), and publicly trusted web certificates must use at least 2048 (lesson 9). Generate a
3072-bit RSA key and a P-256 key, then compare:

```console
$ openssl genpkey -quiet -algorithm RSA -pkeyopt rsa_keygen_bits:3072 -out rsa.key
$ openssl pkey -in rsa.key -pubout -out rsa.pub
$ openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out ec.key
$ openssl pkey -in ec.key -pubout -out ec.pub
$ openssl pkey -pubin -in rsa.pub -noout -text | head -1
Public-Key: (3072 bit)
$ openssl pkey -pubin -in ec.pub -noout -text | head -1
Public-Key: (256 bit)
$ cat ec.pub
-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAElE9SZpmgv9Qicflsvo6AoHNSntU7
CxmnrY8DBHK/0VBDMGP4l1jNrzhHul9xowtPmNxR8jvD+1wJ4aEOj+lo7Q==
-----END PUBLIC KEY-----
$ wc -c rsa.pub ec.pub
625 rsa.pub
178 ec.pub
803 total
```

Both give 128-bit strength, but the elliptic-curve key is under a third of the size and far faster
to use. The PEM (Privacy-Enhanced Mail) format is Base64 text between `BEGIN` and `END` lines.
The private key files `rsa.key` and `ec.key` must be readable only by their owner
(`chmod 600`).

## Hybrid encryption

Asymmetric operations are far slower than AES and can only encrypt small values:
a 3072-bit RSA key encrypts at most a few hundred bytes. So real systems use **hybrid
encryption**: encrypt the data with a fresh random symmetric key, then encrypt only that key with
the recipient's public key. This is called **key wrapping** or key encapsulation:

```console
$ openssl rand 32 > session.key
$ openssl pkeyutl -encrypt -pubin -inkey rsa.pub -pkeyopt rsa_padding_mode:oaep -pkeyopt rsa_oaep_md:sha256 -in session.key -out session.key.enc
$ wc -c session.key session.key.enc
 32 session.key
384 session.key.enc
416 total
$ openssl pkeyutl -decrypt -inkey rsa.key -pkeyopt rsa_padding_mode:oaep -pkeyopt rsa_oaep_md:sha256 -in session.key.enc | cmp - session.key && echo "unwrapped key matches"
unwrapped key matches
```

The 32-byte AES key became 384 bytes, the size of the modulus. The data itself would then be
encrypted with AES-GCM under `session.key`. **OAEP** (Optimal Asymmetric Encryption Padding) is
the padding to use; the older PKCS #1 v1.5 encryption padding has a long history of attacks.
Encrypted email (S/MIME and OpenPGP) works exactly this way.

## Key exchange: Diffie-Hellman

Wrapping still needs the recipient's public key in advance. **Diffie-Hellman** (DH) key exchange
lets two parties who share nothing create a shared secret while an eavesdropper watches every
message. Each side generates a key pair, they swap public keys, and each combines its own private
key with the other's public key. The math makes both results equal, while the eavesdropper, who
has only the two public keys, cannot compute it. **ECDH** is the elliptic-curve version; X25519
(RFC 7748) is the most widely used curve for it:

```python
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric.x25519 import X25519PrivateKey
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

RAW = dict(encoding=serialization.Encoding.Raw, format=serialization.PublicFormat.Raw)

# Each side makes a fresh (ephemeral) key pair for this session only.
client_private = X25519PrivateKey.generate()
server_private = X25519PrivateKey.generate()
client_public = client_private.public_key()
server_public = server_private.public_key()
print("sent by client:", client_public.public_bytes(**RAW).hex()[:32], "...")
print("sent by server:", server_public.public_bytes(**RAW).hex()[:32], "...")

# Each side combines its own private key with the other's public key.
client_secret = client_private.exchange(server_public)
server_secret = server_private.exchange(client_public)
print("same shared secret:", client_secret == server_secret)


def session_key(shared):
    """Derive a 256-bit AES key from the raw shared secret."""
    return HKDF(algorithm=hashes.SHA256(), length=32, salt=None, info=b"demo session").derive(shared)


print("same AES key:", session_key(client_secret) == session_key(server_secret))
```

```text
sent by client: d22993dbe2bccf7b24436afbf7cc04e4 ...
sent by server: c151d90dbe20f0a1cedf86e857a3c27c ...
same shared secret: True
same AES key: True
```

The raw shared secret goes through a **key derivation function** (HKDF here) to produce the
actual AES key. One warning: plain DH proves nothing about *who* is on the other end. An
attacker in the middle can run one exchange with each side and relay everything, an **on-path**
(man-in-the-middle) attack. Real protocols therefore authenticate the exchange: the server signs
its key share with the private key belonging to its certificate.

## Forward secrecy and transport encryption

In the example, both key pairs were made for one session and then thrown away. That is
**ephemeral** Diffie-Hellman: **DHE**, or **ECDHE** with elliptic curves. It gives **forward
secrecy** (also called perfect forward secrecy): if the server's long-term private key is stolen
next year, recordings of today's sessions still cannot be decrypted, because their keys came from
ephemeral values that no longer exist.

Older TLS configurations used **static RSA key transport** instead: the browser wrapped the
session key with the server's RSA public key. Anyone who later stole that private key could
unwrap every recorded session. RFC 9325 says implementations should not negotiate those cipher
suites, and TLS 1.3 removed them entirely; every TLS 1.3 handshake uses ephemeral key exchange.

This pattern, an authenticated key exchange followed by fast authenticated symmetric encryption,
is **transport (communication) encryption**, and it is the same in TLS (HTTPS), SSH, IPsec VPNs
and WireGuard. Lesson 10 walks through a TLS handshake.

## Quantum computers and what comes next

A large quantum computer running Shor's algorithm would break RSA, DH and ECC, though not AES
or SHA-2. None exists yet, but recorded traffic could be decrypted later ("harvest now, decrypt
later"). NIST published its first post-quantum standards in August 2024, including **ML-KEM**
(FIPS 203) for key establishment. Current versions of Chrome, Edge, Firefox and Safari and of
OpenSSL 3.5 already use the **hybrid** key exchange X25519MLKEM768 by default, which combines
classic X25519 with ML-KEM so a connection stays safe if either holds. NIST's draft transition
plan (IR 8547) proposes deprecating 112-bit RSA and ECC after 2030 and disallowing all quantum-vulnerable
RSA and ECC after 2035.

## Common mistakes

- **Sharing or emailing the private key,** or leaving it world-readable on a server.
- **RSA keys of 1024 bits** on old appliances, VPNs and code signing. Use 2048 at least, 3072 for
  long-lived keys, or P-256.
- **Encrypting large data directly with RSA** instead of hybrid encryption.
- **PKCS #1 v1.5 padding for RSA encryption** instead of OAEP.
- **Unauthenticated Diffie-Hellman,** which an on-path attacker can intercept.
- **Static RSA key exchange in TLS 1.2,** which gives up forward secrecy.

## Practice

1. Maya wants to send Leo an encrypted file. Whose key does she encrypt the file key with, and
   which key does Leo use to decrypt?
2. Which offers more security strength: RSA-2048 or P-256?
3. A server's private key leaks. Which recorded sessions can an attacker decrypt if it used (a)
   ECDHE, (b) static RSA key transport?
4. Why does the shared secret from X25519 go through HKDF before use?

### Answers

1. Leo's public key; Leo decrypts with his private key.
2. P-256 (128 bits against 112 bits).
3. (a) None: the session keys came from ephemeral key pairs that were discarded (forward
   secrecy). (b) Every recorded session that used that key.
4. The raw secret is a curve point value, not uniformly random bytes; a key derivation function
   turns it into keys of the right length and binds them to their purpose.

## Key takeaways

- Public keys can be shared; private keys never leave their owner. Encrypt to a public key; sign
  with a private key.
- RSA needs at least 2048 bits (3072 for 128-bit strength); P-256 or X25519 give 128 bits with
  small keys.
- Hybrid encryption wraps a random symmetric key with the recipient's public key (RSA-OAEP).
- ECDHE creates shared session keys and gives forward secrecy; authenticate it to stop on-path
  attacks.
- Post-quantum ML-KEM is already deployed in hybrid form.

## Further reading

- [NIST SP 800-57 Part 1 Rev. 5, Recommendation for Key Management](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final)
- [RFC 7748, Elliptic Curves for Security (X25519)](https://www.rfc-editor.org/rfc/rfc7748)
- [NIST FIPS 203, Module-Lattice-Based Key-Encapsulation Mechanism](https://csrc.nist.gov/pubs/fips/203/final)
- [OpenSSL documentation: openssl-pkeyutl](https://docs.openssl.org/3.0/man1/openssl-pkeyutl/)
