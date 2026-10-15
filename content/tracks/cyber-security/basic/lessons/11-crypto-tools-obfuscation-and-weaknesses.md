---
title: Crypto Tools, Obfuscation and Weaknesses
summary: Where keys really live and how cryptography fails (SY0-801 objectives 1.3 and 2.4). Learn TPMs, HSMs, key management systems and secure enclaves, envelope encryption, the obfuscation techniques of steganography, tokenization and data masking, and the cryptographic vulnerabilities attackers use, from weak algorithms and short keys to reused nonces, downgrades and poor randomness.
minutes: 35
objectives:
  - Choose between a TPM, an HSM, a key management system and a secure enclave for a requirement
  - Explain envelope encryption and why it makes key rotation cheap
  - Distinguish steganography, tokenization and data masking from encryption
  - Recognize cryptographic vulnerabilities and name the fix for each
---

## Outline

1. Hardware and services that protect keys
2. Envelope encryption
3. Obfuscation: steganography, tokenization, masking
4. How cryptography fails
5. A weak-crypto checklist

This lesson covers the tools and obfuscation bullets of SY0-801 objective 1.3, and the
cryptographic vulnerabilities bullet of objective 2.4.

## Hardware and services that protect keys

Lessons 5 to 10 assumed keys stay secret. Software keys in files can be copied by anyone who gets
into the machine, so the most important keys live in dedicated hardware or services:

- A **TPM** (Trusted Platform Module) is a small security chip, or firmware equivalent, in most
  PCs and servers. It generates and stores keys that cannot be exported, records **measurements**
  of the boot process, and can **seal** a key so it is released only if the machine booted
  unmodified software. BitLocker uses it to unlock the system drive without a password while still
  refusing a tampered boot. Typical output on a Windows 11 laptop:

```text
C:\> manage-bde -status C:
Volume C: [OS]
[OS Volume]

    Size:                 475.69 GB
    BitLocker Version:    2.0
    Conversion Status:    Used Space Only Encrypted
    Percentage Encrypted: 100.0%
    Encryption Method:    XTS-AES 128
    Protection Status:    Protection On
    Lock Status:          Unlocked
    Key Protectors:
        TPM
        Numerical Password
```

  "TPM" unlocks the disk at boot; "Numerical Password" is the 48-digit recovery key, which should
  be escrowed in the organization's directory (lesson 8).
- An **HSM** (hardware security module) is a tamper-resistant appliance, card or cloud service
  that generates keys and performs signing and decryption inside itself, so private keys never
  leave in plaintext. Certificate authorities, payment networks and code-signing services keep
  their keys in HSMs validated against NIST's FIPS 140-3 standard.
- A **key management system** (KMS) is a central service that creates, stores, rotates, audits and
  destroys keys for many applications, often backed by HSMs; the major cloud providers each offer one.
  Applications ask the KMS to use a key and never see the master keys.
- A **secure enclave** is an isolated area of a processor with its own protected memory, such as
  Apple's Secure Enclave, which keeps Face ID data and device keys safe even if the main operating
  system is compromised. Trusted execution environments in other chips do the same job.

## Envelope encryption

A KMS cannot encrypt terabytes itself. Instead it uses **envelope encryption**: each file gets its
own random **data key**, and the data key is wrapped (encrypted) by a **key-encryption key** (KEK)
that never leaves the KMS:

```python
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.keywrap import aes_key_unwrap, aes_key_wrap

kek = AESGCM.generate_key(bit_length=256)    # key-encryption key: lives in the KMS or HSM

# Encrypt a file: a fresh data key for this file, wrapped by the KEK.
data_key = AESGCM.generate_key(bit_length=256)
nonce = os.urandom(12)
blob = AESGCM(data_key).encrypt(nonce, b"ward 4 rota, November", None)
wrapped = aes_key_wrap(kek, data_key)
print("stored with the file:", len(wrapped), "byte wrapped key,", len(blob), "byte ciphertext")

# Rotate the KEK: re-wrap the small data key; the file itself is not re-encrypted.
new_kek = AESGCM.generate_key(bit_length=256)
rewrapped = aes_key_wrap(new_kek, aes_key_unwrap(kek, wrapped))
print(AESGCM(aes_key_unwrap(new_kek, rewrapped)).decrypt(nonce, blob, None))
```

```text
stored with the file: 40 byte wrapped key, 37 byte ciphertext
b'ward 4 rota, November'
```

Rotating the master key means re-wrapping 40-byte data keys, not re-encrypting the data, and
destroying a file's data key makes that file unrecoverable (**crypto-shredding**).

## Obfuscation: steganography, tokenization, masking

**Obfuscation** makes data hard to understand or find without necessarily using encryption.

- **Steganography** hides data inside other data, for example in the least significant bits of an
  image's pixels or in unused fields of a file. Nothing looks encrypted, so nothing looks
  suspicious. Attackers use it to smuggle data out or hide malware instructions in images;
  defenders look for files whose size or statistics do not fit their content. Hiding is not
  protection: once found, the message is readable unless it was also encrypted.
- **Tokenization** replaces a sensitive value with a random **token** that has no mathematical
  relationship to it. The real value sits in a separate, guarded **token vault**. Systems that
  store only tokens hold nothing worth stealing, which is how merchants shrink the scope of the
  payment card security standard (PCI DSS).
- **Data masking** hides part of a value when it is displayed or copied, such as showing only the
  last four digits of a card, or filling a test database with realistic fake values. The advanced
  level returns to masking among the data protection methods.

```python
import secrets

vault = {}                                    # token -> real value, kept in a separate, guarded system


def tokenize(card_number):
    token = "tok_" + secrets.token_hex(8)
    vault[token] = card_number
    return token


def mask(card_number):
    return "*" * (len(card_number) - 4) + card_number[-4:]


card = "4111111111111111"                      # a well-known test card number
token = tokenize(card)
print("stored in the orders table:", token)
print("shown to the call center:  ", mask(card))
print("payment service looks up:  ", vault[token] == card)
```

```text
stored in the orders table: tok_abe776221a374cbf
shown to the call center:   ************1111
payment service looks up:   True
```

## How cryptography fails

Algorithms are rarely broken outright; implementations and configurations fail. These are the
**cryptographic vulnerabilities** to recognize:

- **Weak or deprecated algorithms**: MD5 and SHA-1 signatures, DES, 3DES and RC4 (lessons 5 and 6).
- **Short keys**: RSA-1024, still found on old appliances and VPNs (lesson 7).
- **Reused nonces or IVs**: the same key and nonce twice in a stream mode such as CTR or GCM.
- **Poor randomness**: keys and tokens from a predictable generator. In 2008 a Debian change to
  OpenSSL (CVE-2008-0166) left only 32,767 possible keys of each type, so every affected key had
  to be replaced.
- **Downgrade attacks**: an on-path attacker interferes with negotiation so both sides fall back
  to an old, weak protocol or cipher. POODLE (2014) forced a fallback to SSL 3.0; FREAK and Logjam
  (2015) forced 1990s export-grade keys. The fix is to remove old options entirely; TLS 1.3 also
  signs the whole negotiation and marks downgrades.
- **Hardcoded keys and secrets** in source code or images, and **disabled certificate checks**.

Two of these, run in Python:

```python
import random
import secrets

from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

# 1. Poor randomness: a reset token from a generator seeded with the time.
random.seed(1792143611)                       # the second the token was issued
issued = "%032x" % random.getrandbits(128)
random.seed(1792143611)                       # an attacker who guesses the second...
print("predicted:", "%032x" % random.getrandbits(128) == issued)
print("use instead:", secrets.token_urlsafe(16))

# 2. A reused nonce: two messages encrypted with the same key and nonce in CTR mode.
key, nonce = bytes(32), bytes(16)


def ctr(data):
    return Cipher(algorithms.AES(key), modes.CTR(nonce)).encryptor().update(data)


c1, c2 = ctr(b"Meet at gate 4 at 09:00"), ctr(b"Wire 8,000 to acct 7731")
known = b"Meet at gate 4 at 09:00"               # the attacker knows or guesses message 1
print(bytes(a ^ b ^ k for a, b, k in zip(c1, c2, known)))
```

```text
predicted: True
use instead: WclaSgHtU913k5AFndRwrQ
b'Wire 8,000 to acct 7731'
```

The `random` module is predictable by design: whoever knows the seed knows every value. `secrets`
reads the operating system's cryptographic generator. With a reused nonce, the keystream cancels
out: XORing the two ciphertexts gives the XOR of the two plaintexts, so knowing one message reveals
the other without the key.

## A weak-crypto checklist

When reviewing a system, ask: Are any configured algorithms or key sizes deprecated? Where are the
keys, who can read them, and when were they rotated? How are nonces and tokens generated? Can old
protocol versions still be negotiated? Is every certificate validated? Design for **crypto
agility** too: algorithms change (SHA-1 to SHA-2, RSA to post-quantum), so systems should be able
to swap them by configuration.

## Common mistakes

- **Calling obfuscation encryption.** Base64, steganography and masking only hide data.
- **Keeping the KEK in the same database** as the wrapped data keys.
- **`random` for tokens or keys,** or seeding any generator with the time.
- **Leaving fallback to old protocols enabled,** which is what downgrade attacks need.
- **Treating tokenization and hashing as the same.** A hash of a 16-digit card number can be
  brute-forced; a random token cannot.

## Practice

1. A web server's TLS private key must never exist in plaintext on the server. Which tool fits?
2. Why does envelope encryption make rotating the master key fast?
3. A developer stores `sha256(card_number)` instead of a token. Why is that weak?
4. A scan shows a VPN gateway still accepts SSL 3.0 alongside TLS 1.2. Which attack class does this
   enable, and what is the fix?

### Answers

1. An HSM (or a cloud KMS backed by one): the key stays inside and the server asks it to sign.
2. Only the small wrapped data keys are re-encrypted under the new KEK; the data stays as it is.
3. Card numbers have few possible values (and a known check digit), so every hash can be reversed
   by trying all of them. A random token has no relationship to the number.
4. A downgrade attack (as in POODLE). Disable SSL 3.0 and anything older than TLS 1.2.

## Key takeaways

- TPMs bind keys to a device and its boot state; HSMs keep keys inside tamper-resistant hardware;
  a KMS manages keys centrally; secure enclaves isolate keys inside the processor.
- Envelope encryption wraps per-object data keys with a KEK, making rotation cheap.
- Steganography hides, tokenization substitutes, masking redacts; none replaces encryption.
- Vulnerabilities: weak algorithms, short keys, reused nonces, poor randomness, downgrades,
  hardcoded keys.

## Further reading

- [Microsoft Learn: Trusted Platform Module technology overview](https://learn.microsoft.com/en-us/windows/security/hardware-security/tpm/trusted-platform-module-overview)
- [NIST Cryptographic Module Validation Program (FIPS 140-3)](https://csrc.nist.gov/projects/cryptographic-module-validation-program)
- [OWASP Top 10:2025, A04 Cryptographic Failures](https://top10.owasp.org/2025/A04_2025-Cryptographic_Failures)
- [Apple Platform Security: the Secure Enclave](https://support.apple.com/guide/security/the-secure-enclave-sec59b0b31ff/web)
