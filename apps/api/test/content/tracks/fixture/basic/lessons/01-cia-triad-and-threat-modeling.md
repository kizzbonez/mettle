---
title: The CIA Triad and Threat Modeling
summary: The three properties every control protects, and a repeatable way to ask what could go wrong.
minutes: 20
objectives:
  - Define confidentiality, integrity and availability and give an attack on each
  - Identify assets, entry points and trust boundaries in a simple system
  - Use STRIDE to enumerate threats against one component
---

## Outline

1. Three properties, not one
2. Assets, entry points and trust boundaries
3. STRIDE: a checklist for threats
4. From threat to control

## Three properties, not one

"Secure" is not a single quality. Security work protects three separate properties:

- **Confidentiality**: only authorized parties can read the data.
- **Integrity**: data and systems are changed only in authorized ways.
- **Availability**: the system is there when legitimate users need it.

Classifying an incident by the property it breaks tells you what to fix. A leaked customer
table is a confidentiality failure. A tampered invoice is an integrity failure. Ransomware that
encrypts a file server is first of all an **availability** failure: the data still exists, but
nobody can use it.

## Assets, entry points and trust boundaries

Threat modeling starts with three lists.

- **Assets**: what an attacker wants. Credentials, payment data, compute, reputation.
- **Entry points**: every way input reaches the system. Login forms, APIs, file uploads, SSH.
- **Trust boundaries**: lines where the level of trust changes, such as the internet to your
  web server, or the web server to the database.

Attacks cross trust boundaries, so that is where controls belong.

## STRIDE: a checklist for threats

For each component, ask six questions:

| Threat                 | Property broken   | Example                              |
| ---------------------- | ----------------- | ------------------------------------ |
| Spoofing               | Authentication    | Logging in with a stolen password    |
| Tampering              | Integrity         | Editing a price in a request         |
| Repudiation            | Accountability    | Denying an action that left no log   |
| Information disclosure | Confidentiality   | A stack trace that shows credentials |
| Denial of service      | Availability      | Flooding a login endpoint            |
| Elevation of privilege | Authorization     | A user reaching an admin function    |

## From threat to control

A threat model is only useful if each threat ends in a decision: mitigate, accept, or transfer.
Write the decision down next to the threat.

```text
Component: login endpoint
Threat:    Spoofing by password guessing
Control:   rate limit per account and per IP, lock out after repeated failures, offer MFA
Evidence:  failed-login counts in auth.log
```

## Key takeaways

- Name the property that was broken before you name the fix.
- Controls belong on trust boundaries.
- STRIDE turns "what could go wrong?" into six answerable questions.
- Every threat needs a recorded decision and a way to observe it.
