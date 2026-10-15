---
title: Symmetric Encryption
summary: Encrypt data with one shared key (SY0-801 objective 1.3). Learn AES and ChaCha20, why key length matters, why ECB mode leaks patterns, how authenticated encryption (AES-GCM, ChaCha20-Poly1305) detects tampering, the rule never to reuse a nonce, and the levels at which data is encrypted, from full disk to a single record.
minutes: 35
objectives:
  - Explain symmetric encryption, its key distribution problem and where it is used
  - Choose a current algorithm, mode and key length, and recognize deprecated ones
  - Encrypt and decrypt with AES-GCM in Python and explain what the tag and nonce do
  - Match an encryption level (full disk, partition, volume, file, database, record) to the threat it addresses
---

## Outline

1. One key for both directions
2. Algorithms and key length
3. Modes: why ECB leaks
4. Authenticated encryption
5. Encryption levels

This lesson covers the symmetric encryption, algorithms, key length and encryption level bullets
of SY0-801 objective 1.3.

## One key for both directions

**Encryption** turns readable **plaintext** into unreadable **ciphertext** using an algorithm
(the **cipher**) and a **key**; **decryption** reverses it. In **symmetric** encryption the same
secret key does both. It is fast, so it protects almost all bulk data: disks, files, databases
and the traffic inside every HTTPS connection.

Its weakness is **key distribution**: both sides need the same key, and you cannot send it in the
clear over the network you are trying to protect. A hundred people who each want a private
channel with every other would need 4,950 keys. Lesson 7 shows how asymmetric cryptography solves
this.

## Algorithms and key length

- **AES** (Advanced Encryption Standard, NIST FIPS 197) is the standard **block cipher**: it
  encrypts 128-bit blocks with a 128, 192 or 256-bit key. Most processors have AES instructions,
  so it is very fast.
- **ChaCha20** (RFC 8439) is a **stream cipher**: it generates a keystream from a 256-bit key and a
  nonce and combines it with the data. It is fast in software on devices without AES hardware
  and easy to implement without timing leaks.
- **Retired**: DES (56-bit key, brute-forced in under a day as early as 1999), 3DES (NIST SP
  800-131A disallowed it for encryption after 2023), RC4 (a stream cipher with biases, banned from
  TLS by RFC 7465), and Blowfish (64-bit blocks).

A key can always be found by trying every possibility, a **brute-force** attack, so the key
length sets the work. Each extra bit doubles it:

```python
GUESSES_PER_SECOND = 10**12          # a very large cracking cluster
SECONDS_PER_YEAR = 365.25 * 24 * 3600

for name, bits in [("DES", 56), ("AES-128", 128), ("AES-256", 256)]:
    seconds = 2**bits / GUESSES_PER_SECOND
    print(f"{name:8} 2^{bits:<3} keys  {seconds / 3600:.3g} hours  {seconds / SECONDS_PER_YEAR:.3g} years")
```

```text
DES      2^56  keys  20 hours  0.00228 years
AES-128  2^128 keys  9.45e+22 hours  1.08e+19 years
AES-256  2^256 keys  3.22e+61 hours  3.67e+57 years
```

NIST measures **security strength** in bits: today at least 112 bits is required, and its draft
transition plan moves block ciphers to at least 128 bits from 2031. AES-128 meets both. AES-256
gives a wider margin for data that must stay secret for decades, including against future quantum
computers, which would roughly halve the effective strength of a symmetric key.

## Modes: why ECB leaks

A block cipher encrypts one 16-byte block; a **mode of operation** says how to encrypt a whole
message. The naive mode, **ECB** (electronic codebook), encrypts each block independently, so
equal plaintext blocks give equal ciphertext blocks. Three 16-byte records, two of them equal:

```console
$ printf 'GRADE:A+ PASSED.GRADE:A+ PASSED.GRADE:F  FAILED.' > records.txt
$ openssl enc -aes-128-ecb -K 000102030405060708090a0b0c0d0e0f -nopad -in records.txt | od -v -An -tx1 -w16
 5c 92 66 4a 2a 47 d5 7e d1 ce 06 87 ad 61 be 3a
 5c 92 66 4a 2a 47 d5 7e d1 ce 06 87 ad 61 be 3a
 e8 9c c0 b5 0e a7 65 5e b0 53 7f 70 bc b1 36 41
$ openssl enc -aes-128-cbc -K 000102030405060708090a0b0c0d0e0f -iv 8f1e2d3c4b5a69788796a5b4c3d2e1f0 -nopad -in records.txt | od -v -An -tx1 -w16
 1f 9f 29 3e 07 7d 42 91 ee 47 78 7b ac 73 35 bc
 56 bd a7 20 b4 39 ca c9 fc dd f3 e9 d0 0f c6 b7
 0f ff 6e ee c7 e4 67 51 2d b1 bc f0 9f 35 94 2e
```

Without the key, anyone can see that the first two students got the same result. NIST's draft
SP 800-131A Rev. 3 disallows ECB for encrypting data. **CBC** (cipher block chaining) mixes each
block with the previous ciphertext, starting from a random **initialization vector** (IV), so
repeats disappear. **CTR** (counter) mode turns the block cipher into a stream cipher. But CBC and
CTR only hide data; they do not detect changes. Flipping a bit of CTR ciphertext flips the same
bit of the plaintext, and CBC error messages have leaked plaintext in **padding oracle** attacks.

## Authenticated encryption

**Authenticated encryption with associated data** (AEAD) provides confidentiality and integrity
together. Decryption checks a **tag** and refuses anything altered. The two AEAD ciphers you will
meet everywhere, including TLS 1.3, are **AES-GCM** (Galois/Counter Mode, NIST SP 800-38D) and
**ChaCha20-Poly1305**. Python's `cryptography` package provides both:

```python
import os

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

key = AESGCM.generate_key(bit_length=256)       # 32 random bytes
nonce = os.urandom(12)                          # 96 bits, never reused with this key
record_id = b"student-2291"                      # associated data: authenticated, not secret
plaintext = b"GRADE:A+ PASSED"

ciphertext = AESGCM(key).encrypt(nonce, plaintext, record_id)
print(len(plaintext), "bytes in,", len(ciphertext), "bytes out (16-byte tag added)")
print(AESGCM(key).decrypt(nonce, ciphertext, record_id))

tampered = bytearray(ciphertext)
tampered[7] ^= 0x01                             # flip one bit
for label, data, aad in [("one bit flipped", bytes(tampered), record_id),
                         ("moved to another record", ciphertext, b"student-2292")]:
    try:
        AESGCM(key).decrypt(nonce, data, aad)
    except InvalidTag:
        print(label, "-> InvalidTag, refused")
```

```text
15 bytes in, 31 bytes out (16-byte tag added)
b'GRADE:A+ PASSED'
one bit flipped -> InvalidTag, refused
moved to another record -> InvalidTag, refused
```

The **associated data** (here the record ID) is not encrypted but is covered by the tag, so a
valid ciphertext cut from one record and pasted into another is rejected. `ChaCha20Poly1305` has
the same `encrypt` and `decrypt` methods with a 32-byte key.

The **nonce** ("number used once") must never repeat under the same key. NIST SP 800-38D calls
uniqueness almost as important as the secrecy of the key: a repeated nonce in GCM reveals the
relationship between the two plaintexts and lets an attacker forge tags. With random 96-bit
nonces NIST limits one key to 2^32 messages; after that, change the key. Store the nonce next to
the ciphertext; it is not secret.

## Encryption levels

Where you encrypt decides which threat you stop:

| Level | Example | Protects against | Does not protect against |
| --- | --- | --- | --- |
| Full disk | BitLocker, FileVault, LUKS on the whole drive | A lost device that is powered off | Anyone using an unlocked session |
| Partition | One encrypted partition, such as `/home` | Theft, for that partition only | Data on other partitions |
| Volume | An encrypted logical volume, such as a data drive | Theft of the storage | Access while it is mounted |
| File | Single files or folders (EFS, an encrypted archive) | Copies of the file wherever they go | Exposure of the key |
| Database | Transparent data encryption (TDE) of data files and backups | Stolen disks and backups | Queries through the application |
| Record | Column or field encryption of, say, card numbers | Administrators and bulk table leaks | The application holding the key |

A typical Debian laptop installed with encrypted LVM (Logical Volume Manager) shows the layers in
`lsblk`: an unencrypted boot partition, then one LUKS (Linux Unified Key Setup) partition that
holds the root and swap volumes:

```text
NAME                  TYPE  FSTYPE      MOUNTPOINT
nvme0n1               disk
├─nvme0n1p1           part  vfat        /boot/efi
├─nvme0n1p2           part  ext4        /boot
└─nvme0n1p3           part  crypto_LUKS
  └─nvme0n1p3_crypt   crypt LVM2_member
    ├─vg0-root        lvm   ext4        /
    └─vg0-swap        lvm   swap        [SWAP]
```

Defense in depth often combines two levels: full disk encryption for lost laptops and
record-level encryption for the most sensitive fields.

## Common mistakes

- **ECB mode, or CBC/CTR with no integrity check.** Use AES-GCM or ChaCha20-Poly1305.
- **Reusing a nonce with the same key,** for example a counter that resets after a restart.
- **Hardcoding the key in source code.** Keys belong in a key management system (lesson 11).
- **Using a password directly as a key** instead of deriving one with a salt and a slow function.
- **Believing full disk encryption protects a running server.** Once unlocked, the files are
  readable to anyone who gets in.

## Practice

1. Why does symmetric encryption alone not solve sending a secret to a partner you have never met?
2. A vendor's appliance offers 3DES-CBC or AES-128-GCM for its backups. Which do you choose, and
   why?
3. In the AEAD example, what would happen if an attacker changed the record ID stored next to the
   ciphertext?
4. Stolen backup tapes and a database administrator reading card numbers: which encryption level
   stops each?

### Answers

1. Both sides need the same key first, and sending it over the untrusted channel exposes it. Key
   exchange (lesson 7) solves this.
2. AES-128-GCM: 3DES is disallowed for encryption after 2023, has 64-bit blocks, and CBC has no
   integrity check; GCM gives authenticated encryption.
3. Decryption would raise `InvalidTag`, because the associated data is covered by the tag.
4. Database-level encryption (TDE covers backups) stops the tapes; record-level encryption of the
   card number column stops the administrator.

## Key takeaways

- Symmetric encryption uses one key both ways; it is fast but needs a safe way to share keys.
- Use AES (128 or 256-bit keys) or ChaCha20; DES, 3DES and RC4 are retired; ECB leaks patterns.
- Prefer authenticated encryption (AES-GCM, ChaCha20-Poly1305); never reuse a nonce with a key.
- Choose the encryption level by the threat: full disk for lost devices, record level for
  insiders.

## Further reading

- [NIST FIPS 197, Advanced Encryption Standard](https://csrc.nist.gov/pubs/fips/197/final)
- [NIST SP 800-38D, Galois/Counter Mode (GCM)](https://csrc.nist.gov/pubs/sp/800/38/d/final)
- [RFC 8439, ChaCha20 and Poly1305](https://www.rfc-editor.org/rfc/rfc8439)
- [cryptography documentation: authenticated encryption](https://cryptography.io/en/latest/hazmat/primitives/aead/)
- [NIST SP 800-131A Rev. 2, Transitioning the Use of Cryptographic Algorithms and Key Lengths](https://csrc.nist.gov/pubs/sp/800/131/a/r2/final)
