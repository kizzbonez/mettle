---
title: What Security Is
summary: The goals every security decision serves (SY0-801 objective 1.1). Learn what cyber security protects, the CIA triad of confidentiality, integrity and availability, AAA (authentication, authorization and accounting), non-repudiation, and defense in depth, each shown on a real Linux artifact.
minutes: 30
objectives:
  - Explain what cyber security protects and define asset, threat, vulnerability and risk
  - Identify which of confidentiality, integrity and availability an event or control affects
  - Tell authentication, authorization and accounting apart in log entries, and explain non-repudiation
  - Describe defense in depth and list the layers that protect a typical server
---

## Outline

1. What cyber security protects
2. Confidentiality, integrity and availability (CIA)
3. Authentication, authorization and accounting (AAA)
4. Non-repudiation
5. Defense in depth

This lesson covers the first bullets of SY0-801 objective 1.1, "Explain security concepts and
controls". Every later lesson in the course builds on these words, so learn them precisely.

## What cyber security protects

You already know how to use a Linux shell and write Python. Security asks a different question
about the same systems: what could go wrong, and what stops it? United States federal law, which
NIST (the National Institute of Standards and Technology) quotes in its glossary, defines
information security as protecting information and information systems from unauthorized
access, use, disclosure, disruption, modification or destruction.

Four words carry most of the field:

- An **asset** is anything of value: data such as payroll records, systems such as a web server,
  services, and the people who run them.
- A **threat** is anything that could harm an asset: a criminal, a careless employee, a flood.
- A **vulnerability** is a weakness a threat could use: an unpatched program, a weak password,
  an unlocked server room.
- **Risk** combines how likely harm is with how bad it would be. Security work reduces risk to a
  level the organization accepts; it never reaches zero.

A **security control** is any measure that reduces risk: a firewall rule, a policy, a lock, a
backup. Lesson 2 sorts controls into categories and types.

## Confidentiality, integrity and availability (CIA)

Every security goal traces back to three properties, the **CIA triad**:

- **Confidentiality**: only authorized people and systems can read the information. The law
  phrases it as preserving authorized restrictions on access and disclosure.
- **Integrity**: the information is not changed or destroyed without authorization, and you can
  tell if it was.
- **Availability**: authorized users get timely and reliable access when they need it.

Here are confidentiality and integrity on a real Debian system. The sandbox user is not root:

```bash
id
ls -l /etc/passwd /etc/shadow
cat /etc/shadow
printf 'Pay Dana Whitfield 2,450.00\n' > payroll.txt
sha256sum payroll.txt
printf 'Pay Dana Whitfield 9,450.00\n' > payroll.txt
sha256sum payroll.txt
```

```text
uid=10001(sandbox) gid=10001(sandbox) groups=10001(sandbox)
-rw-r--r-- 1 root root   886 Oct 15 16:19 /etc/passwd
-rw-r----- 1 root shadow 503 Oct 15 16:19 /etc/shadow
cat: /etc/shadow: Permission denied
d9bafddf6ad698b9bfb78f2a54fd624980c6fa7e38ad2e796ae61501eeda29e5  payroll.txt
6d533a044a8a538097453c3cd025e5e69ca0dec1c1826a1901cde59c5445f624  payroll.txt
```

`/etc/shadow` holds the password hashes, so only root and the `shadow` group may read it: a
confidentiality control. Changing one digit of the payroll line produced a completely different
SHA-256 fingerprint; if you stored the first value somewhere safe, the second proves the file
was altered. That is an integrity check, and lesson 5 explains how it works. Availability shows
up when things stop: a disk fills, a server crashes, a flood of traffic overwhelms a website.
Backups, spare capacity and redundant power protect availability.

The three goals pull against each other. Encrypting everything and locking accounts after one
wrong password helps confidentiality but hurts availability; a security team balances them for
each asset.

## Authentication, authorization and accounting (AAA)

Access to a system passes through three steps, known as **AAA**:

1. **Authentication** proves an identity. You first claim one (the username, called
   identification), then prove it with a password, a key or a token. People are not the only
   subjects: servers, devices and services authenticate too, usually with certificates or keys.
2. **Authorization** decides what the authenticated subject may do: read this file, run that
   command, open this application.
3. **Accounting** records what was done, by whom and when, so it can be reviewed later. Logs and
   audit trails are accounting.

Network devices use dedicated AAA protocols such as RADIUS (Remote Authentication Dial-In User
Service), but the idea is the same on a single server. This is an authentication log from a
payroll server:

```text
Oct 16 09:14:02 payroll01 sshd[1187]: Accepted publickey for alice from 198.51.100.24 port 50412 ssh2: ED25519 SHA256:zahQ2yAvhcbu/Yj3VC50dpcZD38IHkudTKVg7IO5JM4
Oct 16 09:15:40 payroll01 sudo:    alice : TTY=pts/0 ; PWD=/home/alice ; USER=root ; COMMAND=/usr/bin/systemctl restart payroll.service
Oct 16 09:21:07 payroll01 sshd[1240]: Failed password for bob from 203.0.113.50 port 41822 ssh2
Oct 16 09:21:15 payroll01 sshd[1240]: Accepted password for bob from 203.0.113.50 port 41822 ssh2
Oct 16 09:22:31 payroll01 sudo:      bob : user NOT in sudoers ; TTY=pts/1 ; PWD=/home/bob ; USER=root ; COMMAND=/usr/bin/cat /etc/shadow
```

Read it with AAA in mind:

- Lines 1, 3 and 4 are **authentication**: Alice proved her identity with a key, Bob failed once
  and then succeeded with a password.
- Line 5 is **authorization** at work: Bob is authenticated, but the `sudo` policy does not allow
  him to act as root, so the request was refused.
- Every line is **accounting**: who, from where, when, and which command.

The authentication events can be pulled out with the tools you know:

```console
$ grep -E 'Accepted|Failed' auth.log | cut -d' ' -f6-11
Accepted publickey for alice from 198.51.100.24
Failed password for bob from 203.0.113.50
Accepted password for bob from 203.0.113.50
```

Accounting only helps if the records are kept, protected from tampering and actually read.

## Non-repudiation

**Non-repudiation** is protection against someone falsely denying that they performed an action:
sending a message, approving a payment, signing a contract. NIST's catalog of controls (SP
800-53, control AU-10) asks for irrefutable evidence and names digital signatures as the usual
mechanism.

Non-repudiation needs two things. First, each action must be tied to **one** identity: if five
administrators share an `admin` account, the log proves that "admin" restarted the payroll
service, but not which person did. Second, the evidence itself must have integrity, or the
person can claim it was forged. A digital signature (lesson 8) provides both: only the holder of
a private key can produce it, and anyone can verify it.

## Defense in depth

No single control is perfect. Passwords are phished, patches arrive late, staff make mistakes.
**Defense in depth** layers several independent controls so that an attack that gets past one
is stopped or noticed by the next. NIST describes it as integrating people, technology and
operations to create barriers across multiple layers. For the payroll server, the layers could
be:

```text
Layer            Control                                        Goal it serves
Perimeter        Firewall allows only HTTPS and VPN traffic      Confidentiality, availability
Identity         Multifactor sign-in, no shared accounts         Confidentiality, non-repudiation
Host             Patching, least privilege, file permissions     Integrity, confidentiality
Application      Input validation, encrypted connections         Integrity, confidentiality
Data             Encrypted disks, checksums, backups             Confidentiality, integrity, availability
Monitoring       Central logs reviewed daily, alerts             Accounting, detection
People           Training, a written change process              All three
```

If a phishing email steals Bob's password, multifactor sign-in still blocks the login; if that
also fails, least privilege stops him reading `/etc/shadow`, and the logs show the attempt.

## Common mistakes

- **Treating security as confidentiality only.** Ransomware is mostly an availability attack, and
  a silently altered payroll file is an integrity failure even if nobody read it.
- **Confusing authentication and authorization.** A valid login says who you are, not what you
  may do. "He logged in, so he was allowed" is the wrong conclusion from Bob's lines.
- **Shared and generic accounts.** They destroy accounting and non-repudiation, because no action
  can be tied to a person.
- **Logs nobody keeps or reads.** Accounting that is overwritten after a day, or stored where an
  intruder can edit it, proves nothing.
- **One strong wall.** A firewall with nothing behind it fails completely the first time it is
  bypassed; defense in depth assumes each layer will sometimes fail.

## Practice

1. Which CIA goal is hit by each event? (a) A laptop with unencrypted customer records is stolen.
   (b) A storm cuts power to the only data center for a day. (c) An intruder edits bank details
   in supplier records.
2. From the log above, which line shows a subject who passed authentication but failed
   authorization?
3. The help desk team shares one account, `helpdesk`, to reset passwords. Which two properties
   from this lesson does that weaken, and what is the fix?
4. Name three layers of defense in depth that would still protect the payroll server if its
   firewall rules were accidentally deleted.

### Answers

1. (a) Confidentiality. (b) Availability. (c) Integrity.
2. Line 5: Bob logged in successfully (line 4) but was refused when he asked `sudo` to run a
   command as root.
3. Accounting and non-repudiation: the log can only say "helpdesk" did it. Give each person
   their own account with only the permissions the job needs.
4. Any three of: multifactor sign-in, patching, least privilege and file permissions, encrypted
   connections, disk encryption, backups, monitoring and alerts.

## Key takeaways

- Security protects assets against threats that exploit vulnerabilities; controls reduce risk.
- CIA: confidentiality (only authorized readers), integrity (no unauthorized change),
  availability (access when needed).
- AAA: authentication proves identity, authorization grants permissions, accounting records
  actions.
- Non-repudiation needs individual identities and tamper-evident evidence, usually signatures.
- Defense in depth layers independent controls so one failure is not a breach.

## Further reading

- [NIST CSRC glossary: information security](https://csrc.nist.gov/glossary/term/information_security)
- [NIST CSRC glossary: non-repudiation](https://csrc.nist.gov/glossary/term/non_repudiation)
- [NIST CSRC glossary: defense in depth](https://csrc.nist.gov/glossary/term/defense_in_depth)
- [NIST SP 800-53 Rev. 5, Security and Privacy Controls (AU-10 Non-repudiation)](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)
