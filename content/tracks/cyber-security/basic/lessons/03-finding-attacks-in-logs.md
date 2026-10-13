---
title: Finding Attacks in Logs
summary: Read SSH authentication logs and turn thousands of lines into a short list of offenders with grep, awk, sort and uniq.
minutes: 25
objectives:
  - Read the fields of an sshd log line
  - Build a shell pipeline that counts events per source address
  - Sort and threshold results to separate an attack from background noise
---

## Outline

1. What a brute-force attack looks like
2. Anatomy of an sshd log line
3. The counting pipeline
4. Thresholds and what to do next

## What a brute-force attack looks like

Any server with SSH on the internet is guessed at constantly. In the log, an attack is not one
dramatic line. It is the **same source address failing again and again**, often against
usernames that do not exist.

## Anatomy of an sshd log line

```text
Oct 12 03:14:07 web01 sshd[2211]: Failed password for invalid user admin from 203.0.113.7 port 51122 ssh2
└──── time ───┘ host  process     └ event ─────────┘ └ account ───────┘      └ source ──┘
```

Two things to notice. The word `invalid user` appears only when the account does not exist, so
the field positions shift between lines. And the address always follows the word `from`. Anchor
on the word, not on a column number.

## The counting pipeline

Almost every log question is the same four steps: **filter**, **extract**, **count**, **rank**.

```bash
grep 'Failed password' /var/log/auth.log \
  | awk '{ for (i = 1; i <= NF; i++) if ($i == "from") print $(i + 1) }' \
  | sort \
  | uniq -c \
  | sort -rn
```

- `grep` keeps only the event you care about.
- `awk` walks the fields and prints the one after `from`.
- `sort | uniq -c` counts identical lines. `uniq` only merges adjacent lines, so the first
  `sort` is not optional.
- `sort -rn` ranks by count, highest first.

`awk` can also do the counting by itself with an associative array, which avoids sorting the
whole file first:

```bash
awk '/Failed password/ { for (i = 1; i <= NF; i++) if ($i == "from") n[$(i + 1)]++ }
     END { for (ip in n) print ip, n[ip] }' /var/log/auth.log
```

## Thresholds and what to do next

A person mistyping a password fails once or twice. A script fails hundreds of times. Pick a
threshold, report only what crosses it, and make the order of the output predictable so the
report can be compared from one day to the next.

What follows detection is response: block the address, confirm no attempt succeeded
(`Accepted password` from the same source is the line to fear), and consider disabling password
authentication in favour of keys.

## Key takeaways

- An attack is a pattern across lines, not a single line.
- Anchor on words such as `from`; column positions shift.
- Filter, extract, count, rank.
- Always check whether the attacker eventually succeeded.
