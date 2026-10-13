---
title: Authentication and Password Storage
summary: How accounts are proven, how they are attacked, and why a password database must be slow to crack.
minutes: 25
objectives:
  - Distinguish the three authentication factors and combine them into MFA
  - Explain why fast hashes are unsuitable for passwords
  - Describe what a salt does and what it does not do
  - Recognize credential stuffing and brute force in the wild
---

## Outline

1. Factors of authentication
2. How passwords are attacked
3. Hashing, salting and work factors
4. Defenses that stack

## Factors of authentication

A factor is a category of evidence:

- **Something you know**: a password or PIN.
- **Something you have**: a phone running an authenticator app, a hardware security key.
- **Something you are**: a fingerprint or a face.

Multi-factor authentication (MFA) requires factors from **different** categories. A password
plus a security question is still one factor, used twice.

## How passwords are attacked

- **Brute force**: try every candidate against one account.
- **Dictionary attack**: try likely passwords first.
- **Credential stuffing**: replay username and password pairs leaked from another site. It
  works because people reuse passwords.
- **Offline cracking**: steal the password database and guess against it at full speed, with
  no rate limit in the way.

The last one is why storage matters. Assume the database will leak one day.

## Hashing, salting and work factors

Never store the password. Store the output of a one-way function, and compare outputs at
sign-in.

A general-purpose hash such as SHA-256 is the wrong tool, because it is designed to be fast:
commodity hardware computes billions per second. Password hashing functions such as
**bcrypt**, **scrypt** and **Argon2** are deliberately slow, and tunable:

```text
$2b$12$Q9o5Yb0nC5m7dM9M3rYv8e0Xo0m0fS3fQeYz7xw1cJ8m2mTqk1x6S
 │   │  └─ 22-character salt, then the hash
 │   └─ cost: 2^12 rounds
 └─ algorithm: bcrypt
```

A **salt** is a random value stored with each hash. It makes identical passwords hash
differently, which defeats precomputed tables and stops one cracked hash from revealing every
user with the same password. A salt is not secret, and it does not slow down an attack on a
single account. The **cost factor** does that.

## Defenses that stack

- Slow, salted hashing limits the damage of a leak.
- Rate limiting and lockout limit online guessing.
- MFA makes a correct password insufficient on its own.
- Checking new passwords against known-breached lists blocks the most guessable choices.

## Key takeaways

- MFA means different categories of evidence, not two secrets.
- Fast hashes are for integrity checks. Passwords need bcrypt, scrypt or Argon2.
- Salts stop precomputation; cost factors slow down every guess.
- Design for the day the database leaks.
