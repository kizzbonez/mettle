---
title: Passwords, MFA and Passkeys
summary: Authentication done the current way (SY0-801 objective 4.5). Set password rules from NIST SP 800-63B-4 (length, no composition rules, no forced expiry, blocklists), store passwords with Argon2id, use password managers, compare MFA methods from OTP and tokens to biometrics and backup codes, adopt phishing-resistant passkeys, and audit accounts with compromised credential monitoring and policy reports.
minutes: 40
objectives:
  - Write a password policy that follows NIST SP 800-63B-4 on length, complexity, reuse, expiration and age
  - Explain how OTP, hard and soft tokens, biometrics and backup codes work and how strong each is
  - Explain how passkeys (FIDO2 and WebAuthn) resist phishing, and synced versus device-bound passkeys
  - Plan compromised credential monitoring, account auditing and a password policy report
---

## Outline

1. Authentication factors
2. Password rules, the current way
3. Storing passwords
4. Password managers
5. MFA methods
6. Passwordless and passkeys
7. Monitoring and auditing

This lesson covers the MFA and password concepts bullets of SY0-801 objective 4.5 (domain 4,
Security Operations). The rest of identity management comes in the advanced level.

## Authentication factors

Authentication (lesson 1) uses **factors**: something you **know** (a password, a PIN), something
you **have** (a phone, a security key, a smart card) and something you **are** (a fingerprint, a
face). **Multifactor authentication** (MFA) combines at least two *different* factors. A password
plus a security question is still one factor.

## Password rules, the current way

NIST SP 800-63B-4, the final revision published in July 2025, overturned much traditional advice:

- **Length** is what counts: at least **15 characters** when the password is the only factor, at
  least 8 when it is used with another factor. Allow at least 64, and accept spaces, printable
  ASCII and Unicode, counting each Unicode code point as one character.
- **No composition rules.** Verifiers "SHALL NOT" demand mixtures of character types. "One
  capital, one digit, one symbol" produces `Summer2026!`, which attackers guess early.
- **A blocklist.** Each new password is compared, whole, against common, expected and breached
  passwords and context-specific words such as the service and user name.
- **No periodic expiration.** Verifiers "SHALL NOT" require changes on a schedule, but "SHALL
  force a change if there is evidence" of compromise. Forced 90-day changes produced sequences
  like `Autumn2026!`, `Winter2026!`.
- **No hints or security questions;** allow paste and password managers.
- **Rate limiting:** at most 100 consecutive failures before the account is protected.

**Password age** has two parts: a maximum age is expiration, now dropped; a minimum age stopped
users cycling through a history list back to an old password, but it also blocks an urgent change
after a compromise. **Reuse** across sites is the real danger: when one site is breached, attackers
try the leaked pairs everywhere (**credential stuffing**).

A checker that applies these rules:

```python
import unicodedata

# Common, breached and context-specific passwords, stored lowercased without punctuation.
BLOCKLIST = {"pssw0rd", "password123456789", "summer2026summer2026", "ridgewayclinic2026"}


def check_password(password, used_with_mfa=False):
    password = unicodedata.normalize("NFC", password)
    minimum = 8 if used_with_mfa else 15
    if len(password) < minimum:                       # code points, not bytes
        return f"rejected: shorter than {minimum} characters"
    if len(password) > 64:
        return "rejected: longer than 64 characters"
    folded = "".join(ch for ch in password.lower() if ch.isalnum())
    if folded in BLOCKLIST:                           # the whole password, never substrings
        return "rejected: on the blocklist, choose another"
    return "accepted"


for candidate, mfa in [("P@ssw0rd!", False), ("P@ssw0rd!", True), ("Summer2026Summer2026", False),
                       ("Ridgeway-Clinic-2026", False), ("lantern walrus quietly 47", False),
                       ("fjäll stuga vinter", False)]:
    print(f"{candidate!r:29} mfa={mfa!s:5} {check_password(candidate, mfa)}")
```

```text
'P@ssw0rd!'                   mfa=False rejected: shorter than 15 characters
'P@ssw0rd!'                   mfa=True  rejected: on the blocklist, choose another
'Summer2026Summer2026'        mfa=False rejected: on the blocklist, choose another
'Ridgeway-Clinic-2026'        mfa=False rejected: on the blocklist, choose another
'lantern walrus quietly 47'   mfa=False accepted
'fjäll stuga vinter'          mfa=False accepted
```

The "complex" `P@ssw0rd!` fails twice, while four ordinary words pass.

## Storing passwords

NIST requires salted hashes with a cost factor and a salt of at least 32 bits (lesson 5). The
OWASP cheat sheet's first choice is **Argon2id**; Python's `cryptography` package provides it:

```python
import secrets

from cryptography.exceptions import InvalidKey
from cryptography.hazmat.primitives.kdf.argon2 import Argon2id

# OWASP's minimum for Argon2id: 19 MiB of memory (m, in KiB), 2 passes (t), 1 lane (p).
hasher = Argon2id(salt=secrets.token_bytes(16), length=32, iterations=2, lanes=1, memory_cost=19456)
record = hasher.derive_phc_encoded(b"lantern walrus quietly 47")
print(record)

try:
    Argon2id.verify_phc_encoded(b"lantern walrus quietly 48", record)
except InvalidKey:
    print("wrong password rejected")
```

```text
$argon2id$v=19$m=19456,t=2,p=1$A6hQ/7/NBhryZYfRJMM4xg$JznsG/lCP42LcX3sO3mcfafhyx/Dv3QhVNyFiXOvkRw
wrong password rejected
```

The record carries the algorithm, version and parameters, then the salt and hash, so the cost can
be raised later. You will also meet bcrypt (`$2b$12$...`, cost 12; OWASP asks for at least 10)
and PBKDF2 (`$pbkdf2-sha256$600000$...`). A bare 32 or 40-character hex string is an unsalted MD5
or SHA-1 hash: fix it as an incident.

## Password managers

A **password manager** generates a long random password for every site and fills it in, which
ends reuse. It fills only on the domain the password was saved for, so it will not type into a
look-alike phishing site. Protect the vault with a strong master password and MFA.

## MFA methods

- **One-time passwords** (OTP) change with each use: HOTP (RFC 4226) counts events, **TOTP** (RFC
  6238) uses the time. A **soft token** (an authenticator app) and the server share a secret at
  enrollment and compute the same HMAC:

```python
import hashlib
import hmac
import struct


def totp(secret, unix_time, digits=6, step=30):
    """RFC 6238: HMAC of the number of 30-second steps since 1970, truncated to digits."""
    counter = struct.pack(">Q", unix_time // step)
    mac = hmac.new(secret, counter, hashlib.sha1).digest()
    offset = mac[-1] & 0x0F
    number = struct.unpack(">I", mac[offset:offset + 4])[0] & 0x7FFFFFFF
    return str(number % 10**digits).zfill(digits)


secret = b"12345678901234567890"          # the RFC 6238 test secret, shared at enrollment
print(totp(secret, 59, digits=8), totp(secret, 1111111109, digits=8))
print("code at 09:40:11 UTC on 16 Oct 2026:", totp(secret, 1792143611))
```

```text
94287082 07081804
code at 09:40:11 UTC on 16 Oct 2026: 407248
```

  The first line matches the RFC's published test values. A typed code can be relayed by a
  phishing site in real time, so NIST does not count OTP as phishing-resistant.
- **Hard tokens** are dedicated devices: an OTP key fob, a smart card, a FIDO2 security key.
- **SMS and voice codes** use the phone network; NIST marks them **restricted** (SIM swapping,
  interception) and requires offering an alternative.
- **Push approvals** should ask the user to type a displayed number, so a flood of prompts
  (**MFA fatigue**) cannot be approved by reflex.
- **Biometrics** are not secrets: faces are photographed, fingerprints left on glass. NIST allows
  them only with a physical authenticator, as the unlock for a phone or security key.
- **Backup codes** are single-use codes for a lost device: store them hashed, invalidate each on
  use, and keep them offline.

## Passwordless and passkeys

**Passwordless** authentication removes the shared secret. A **passkey** is a FIDO2 credential:
the browser API **WebAuthn** (a W3C Recommendation) plus the FIDO Alliance's CTAP protocol for
external authenticators. At registration the device creates a key pair *for that site only*; the
site stores just the public key. To sign in, the site sends a random challenge, the user unlocks
the authenticator with a fingerprint, face or PIN, and the authenticator signs the challenge with
the site's verified name. So:

- **Phishing resistance.** The key is bound to the real site's domain, so a look-alike site gets
  no usable signature. NIST cites WebAuthn as an example of this "verifier name binding".
- **Nothing to steal from the server.** A breached database holds public keys only.
- **MFA in one step:** the device (have) plus the local unlock (are or know).

**Synced passkeys** are copied across a user's devices by a provider such as a platform keychain
or password manager; NIST allows them up to AAL2 (authenticator assurance level 2). **Device-bound
passkeys** never leave one authenticator, such as a hardware security key, and can meet AAL3.
Register a second passkey for recovery rather than falling back to SMS.

## Monitoring and auditing

- **Compromised credential monitoring** checks passwords against breach collections and alerts
  when staff credentials appear in a new dump; NIST then requires a forced change.
- **Account auditing** regularly reviews who lacks MFA, dormant and shared accounts, service
  accounts whose secrets never change, and hashes in old formats.
- A **policy report** summarizes compliance for management: MFA and phishing-resistant MFA
  coverage, passwords failing current rules, blocklist hits.

## Common mistakes

- **Complexity rules and 90-day expiry** "because the auditor expects it". NIST now forbids both.
- **Calling a password plus a security question MFA.**
- **SMS as the only second factor,** or as the recovery path for passkeys.
- **Blocking paste** in password fields, which breaks password managers.
- **Backup codes stored in plaintext** or reusable.

## Practice

1. Rewrite this policy to match NIST SP 800-63B-4: "8 to 16 characters, one upper case letter,
   one digit, one symbol, change every 90 days."
2. Which resists a real-time phishing proxy: TOTP, push with number matching, or a passkey?
3. A user's password appears in a newly published breach. What does NIST require?
4. Classify each factor: a TOTP app, a PIN, a fingerprint that unlocks a security key.

### Answers

1. At least 15 characters (8 if always used with MFA), allow at least 64 and any characters, no
   composition rules, a blocklist check, no scheduled changes but a forced change on evidence of
   compromise, and rate-limited failures.
2. Only the passkey: the others produce something the user can be tricked into entering or
   approving for the attacker's session.
3. A forced password change (and a check for misuse of the account).
4. Something you have; something you know; something you are.

## Key takeaways

- NIST SP 800-63B-4: length (15, or 8 with MFA), no composition rules, blocklists, no periodic
  expiry, forced change on compromise, password managers and paste allowed.
- Store passwords with Argon2id (or scrypt, bcrypt, PBKDF2) and a unique salt.
- OTP, push and SMS can be phished; passkeys are phishing-resistant and leave nothing to steal.
- Biometrics only unlock a device; backup codes are single-use and stored hashed.
- Monitor for compromised credentials and audit accounts and MFA coverage.

## Further reading

- [NIST SP 800-63B-4, Authentication and Authenticator Management](https://pages.nist.gov/800-63-4/sp800-63b.html)
- [FIDO Alliance: Passkeys](https://fidoalliance.org/passkeys/)
- [W3C Web Authentication (WebAuthn) Level 3](https://www.w3.org/TR/webauthn-3/)
- [RFC 6238, TOTP: Time-Based One-Time Password Algorithm](https://www.rfc-editor.org/rfc/rfc6238)
