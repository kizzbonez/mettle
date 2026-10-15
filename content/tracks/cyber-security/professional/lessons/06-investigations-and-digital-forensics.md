---
title: Investigations and Digital Forensics
summary: Support a security investigation with the right data (SY0-801 objective 4.8, and the investigation bullets of 4.7). Choose log and trace data types and data sources, capture memory dumps, bit-level copies and snapshots in order of volatility, prove file and log integrity with hashes, keep a chain of custody, preserve evidence for e-discovery, involve HR, legal and accounts, and parse logs into a timeline.
minutes: 40
objectives:
  - Choose the log and trace data types and data sources that answer an investigation's questions
  - Capture memory dumps, bit-level copies and snapshots in order of volatility and prove their integrity with hashes
  - Keep a chain of custody, preserve evidence and explain e-discovery and the stakeholders involved
  - Parse and correlate logs with grep, awk and jq into findings
---

## Outline

1. The forensic process
2. Log and trace data types
3. Data sources
4. Order of volatility and system images
5. File and log integrity
6. Chain of custody, preservation and e-discovery
7. Stakeholders
8. Log-parsing techniques

This lesson covers SY0-801 objective 4.8 and the investigation bullets of 4.7.

## The forensic process

NIST SP 800-86 describes four phases: **collection** (identify, acquire and protect data),
**examination** (extract what is relevant), **analysis** (draw conclusions) and **reporting**.
Every step is documented so that someone else could repeat it and reach the same result, which
is what makes evidence credible to managers, regulators and courts.

## Log and trace data types

- **Access and accounting**: who used what. **Logical** records come from file-access auditing,
  VPN sessions and RADIUS accounting; **physical** records from badge readers and visitor books.
- **Device** logs: firewalls, switches, printers, IoT devices.
- **Server** logs: the Windows Security log, Linux `auth.log` or the systemd journal.
- **Application** logs: web server access logs, database audit trails, business events.
- **Authentication** logs: identity provider sign-ins, Kerberos tickets, MFA results.
- **Communication**: email message traces, chat and voice call records.
- **Audit** logs: administrative and security changes, such as a cloud audit trail of who
  changed a policy, or Windows event 1102, "the audit log was cleared".
- **Endpoint** telemetry from EDR: process creation, command lines, network connections.
- **Network**: proxy, DNS, firewall and IDS logs.
- **Metadata**, data about data: email headers, file timestamps, document authors, photo EXIF
  tags. Headers of a suspicious invoice email:

```text
Return-Path: <billing@northwind-freight.co>
Received: from mail.northwind-freight.co (unknown [198.51.100.77]) by mx1.example.com
Authentication-Results: mx1.example.com; spf=pass smtp.mailfrom=northwind-freight.co;
 dkim=pass header.d=northwind-freight.co; dmarc=pass header.from=northwind-freight.co
From: "Northwind Logistics Billing" <billing@northwind-freight.co>
Reply-To: <accounts.northwind@proton.me>
Date: Tue, 13 Oct 2026 16:02:44 +0000
Subject: Updated bank details for invoice 88231
```

SPF, DKIM and DMARC (RFC 9989, taught in the advanced level) all pass because the attacker owns
`northwind-freight.co`, a look-alike of the real supplier's domain, and the `Reply-To` sends
answers to a free mailbox.

## Data sources

**Vulnerability scans** show whether a host was vulnerable and since when. **Automated reports**
from tools give scheduled summaries. **NetFlow/IPFIX** shows volumes and peers. **Surveillance
footage** places people at doors and desks. **Security tools** (EDR, IDS, DLP, SIEM) hold
alerts and telemetry, **dashboards** show the state at a moment, and **packet captures** hold
full content, the only source that shows exactly what crossed the wire.

## Order of volatility and system images

Collect the most fleeting data first. RFC 3227 lists: registers and cache; routing table, ARP
cache, process table, kernel statistics and memory; temporary file systems; disk; remote logging
and monitoring data; physical configuration and network topology; archival media. It also
warns: do not shut down before collection, and do not trust the programs on the compromised
system.

- A **memory dump** captures RAM: running processes, network connections, encryption keys and
  fileless malware that never touches disk.
- A **bit-level copy** (forensic image) copies every sector, including deleted files and
  unallocated space, through a hardware **write blocker** so the original cannot change.
- A **snapshot** freezes a virtual machine or cloud volume at a point in time: fast and often
  the only option in the cloud, but limited to what the platform captures.

Integrity is proven with a cryptographic hash taken at acquisition and checked later. Here the
file `usb-device.raw` stands in for a seized USB drive:

```bash
dd if=usb-device.raw of=EV-2026-0412-01.img bs=1M conv=noerror,sync status=none
sha256sum usb-device.raw EV-2026-0412-01.img
cp EV-2026-0412-01.img working.img
printf 'X' | dd of=working.img bs=1 seek=0 conv=notrunc status=none
sha256sum working.img
sha256sum EV-2026-0412-01.img > EV-2026-0412-01.sha256
sha256sum -c EV-2026-0412-01.sha256
```

```text
b7bee3e8fbb5658bb17c645d2e043356437c981bf347c839bbfbbd09eb269bf2  usb-device.raw
b7bee3e8fbb5658bb17c645d2e043356437c981bf347c839bbfbbd09eb269bf2  EV-2026-0412-01.img
f2ba4b7e234c76625bdb24e3624ecc67a34639402a784fc3fb691d922dca7d93  working.img
EV-2026-0412-01.img: OK
```

The copy matches the source exactly; changing one byte of a working copy changes the whole hash.
Analysts examine a working copy and never the original evidence.

## File and log integrity

Attackers delete and edit logs. Defenses: forward logs in real time to a central store the host
cannot modify, keep archives on write-once (WORM) or immutable storage, hash or sign log files
when they rotate, restrict who can read and delete logs, and synchronize clocks. Treat gaps and
cleared logs as findings in their own right.

## Chain of custody, preservation and e-discovery

The **chain of custody** records where, when and by whom evidence was collected, every handover,
and how it was stored, so nobody can claim it was swapped or altered:

```text
CHAIN OF CUSTODY                      Case IR-2026-031   Item EV-2026-0412-01
Description: 8 GB USB flash drive, black, serial 0401558f8a2c, found in desk F-114
Collected:   2026-10-14 09:20 UTC by D. Osei (Forensics), photographed in place
Image:       EV-2026-0412-01.img  SHA-256 b7bee3e8...eb269bf2 (write blocker WB-07)
Storage:     evidence locker 2, bag S-118223 (tamper-evident)

Date/time (UTC)    Released by         Received by         Purpose              Seal intact
2026-10-14 10:05   D. Osei             L. Hart (Legal)     review for privilege yes
2026-10-15 14:30   L. Hart             D. Osei             return to locker     yes
```

**Preservation** keeps relevant data from being lost: suspend automatic deletion, extend log
retention, snapshot cloud resources, and apply a **legal hold** when litigation is expected.
**E-discovery** is the legal process of identifying, preserving, collecting, reviewing and
producing electronically stored information (ESI) for a lawsuit or regulator; data that was not
preserved, or whose custody cannot be shown, may be unusable.

## Stakeholders

- **Human resources (HR)**: insider cases, interviews, discipline, employee privacy rules.
- **Legal**: privilege, regulators, law enforcement, legal holds and litigation; many
  investigations run under the direction of counsel.
- **Accounts** (finance): fraud and business email compromise, tracing and recalling payments.

## Log-parsing techniques

Search with `grep` and regular expressions, extract fields with `awk` or `cut`, parse structured
logs with `jq`, normalize timestamps to UTC and names to one case, aggregate with
`sort | uniq -c` or a group-by, and correlate sources on a shared key such as user, address or
session ID. Sign-in events grouped by user and source:

```bash
jq -s -r 'group_by([.user, .ip])[]
  | [.[0].user, .[0].ip, (map(select(.result == "failure")) | length),
     (map(select(.result == "success")) | length), .[0].time, .[-1].time] | @tsv' signins.jsonl |
  column -t -N USER,SOURCE,FAIL,OK,FIRST,LAST
```

```text
USER     SOURCE         FAIL  OK  FIRST                 LAST
a.reyes  10.20.4.31     0     1   2026-10-14T07:58:11Z  2026-10-14T07:58:11Z
a.reyes  198.51.100.44  3     1   2026-10-13T22:14:02Z  2026-10-13T22:15:40Z
m.chen   10.20.4.18     1     1   2026-10-14T08:02:51Z  2026-10-14T08:03:05Z
```

From an outside address at 22:14, three wrong passwords were followed by a success approved by
a push notification: a correct password guessed or stolen, and possibly a user tapping
"approve" on a prompt they did not start. Ask the user, and review what that session did.

## Common mistakes

- Running tools from the suspect system, or browsing the original disk instead of an image.
- Pulling the plug before capturing memory.
- Recording a hash at acquisition but never re-verifying it.
- Gaps in the chain of custody, such as evidence left on a desk overnight.
- Comparing timestamps from different time zones without normalizing them.

## Practice

1. Order these by volatility: disk image, memory, remote SIEM logs, ARP cache.
2. Which data type shows that someone entered the server room at 02:10?
3. A reviewer asks how you know the image was not altered. What do you show?

### Answers

1. ARP cache and memory, then the disk image, then remote SIEM logs.
2. Physical access logs (badge reader), supported by surveillance footage.
3. The SHA-256 hash recorded at acquisition, a matching re-verification, and the chain of
   custody showing every handover.

## Key takeaways

- Choose data types and sources that answer who, what, when and how.
- Collect in order of volatility; image with a write blocker; work on copies.
- Hashes prove integrity; the chain of custody proves handling; preservation keeps evidence.
- Normalize, parse and correlate logs into a timeline, and involve HR, legal and finance.

## Further reading

- [NIST SP 800-86, Guide to Integrating Forensic Techniques into Incident Response](https://csrc.nist.gov/pubs/sp/800/86/final)
- [RFC 3227: Guidelines for Evidence Collection and Archiving](https://www.rfc-editor.org/rfc/rfc3227.html)
- [NIST SP 800-61 Rev. 3](https://csrc.nist.gov/pubs/sp/800/61/r3/final)
