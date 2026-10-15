---
title: Vulnerabilities and Attack Surfaces
summary: The weaknesses Security+ lists beyond code, from unsupported, unpatched, obsolete and unmanaged systems, OS and virtualization flaws and zero-days to stale credentials, rogue devices, shadow IT, wireless and low-power links, identity providers, mobile devices, misconfiguration, public repositories and public object storage, and how to find each one (SY0-801 objective 2.4).
minutes: 35
objectives:
  - Find unsupported, unmanaged and ownerless systems in an asset inventory
  - Explain OS, virtualization and zero-day vulnerabilities with real examples
  - Describe stale credentials, rogue devices, shadow IT, wireless links, identity providers and mobile devices as attack surfaces
  - Recognize public object storage and secrets in public repositories, and fix them
---

## Outline

1. Systems that cannot be defended
2. Operating systems, virtualization and zero-days
3. Credentials, rogue devices and shadow IT
4. Wireless and low-power communications
5. Identity providers and mobile devices
6. Misconfiguration, public storage and public repositories

## Systems that cannot be defended

The **attack surface** is every point where an attacker can try to get in or pull data out. The
previous two lessons covered the vectors; this one covers the weaknesses at the end of them. The
first group is systems that no one can protect properly:

- **Unsupported products**: past the vendor's end of support, so new flaws are never fixed.
  Windows 10 reached end of support on 14 October 2025; even Windows 11 versions expire (24H2 Home
  and Pro on 13 October 2026).
- **Unpatched systems**: supported, but the fixes were not installed.
- **Obsolete systems**: technology too old to update or replace easily, such as a machine
  controller that needs an old OS or protocol. Isolate it and compensate with network controls.
- **Unmanaged systems**: no endpoint agent, no patch management, often no known owner. You cannot
  protect what you do not know you have.
- **Ports and services**: every listening service is a door, as the scan in the previous lesson
  showed. Disable what is not needed and filter the rest.

An inventory finds them. This one is a CSV kept by a ferry operator, checked on 16 October 2026:

```text
host,os,support_ends,edr_agent,last_patched,owner
ws-114,Windows 11 24H2,2026-10-13,yes,2026-10-08,finance
ws-120,Windows 10 22H2,2025-10-14,yes,2025-10-14,dispatch
srv-ticket,Ubuntu 20.04 LTS,2025-05-31,no,2025-04-02,booking
kiosk-pier3,Windows 10 IoT Enterprise LTSC 2021,2032-01-13,no,2026-09-10,terminal ops
nas-crew,unknown,unknown,no,unknown,
```

```bash
today=2026-10-16
# ISO dates compare correctly as strings. Print every problem found for each host.
awk -F, -v today="$today" 'NR > 1 {
  p = ""
  if ($3 == "unknown")      p = p " unknown-os"
  else if ($3 < today)      p = p " unsupported"
  if ($4 != "yes")          p = p " unmanaged"
  if ($6 == "")             p = p " no-owner"
  if (p != "") print $1 ":" p
}' assets.csv
```

```text
ws-114: unsupported
ws-120: unsupported
srv-ticket: unsupported unmanaged
kiosk-pier3: unmanaged
nas-crew: unknown-os unmanaged no-owner
```

ws-114 only needs the next feature update. srv-ticket runs Ubuntu 20.04, whose standard support
ended in May 2025, with no agent: upgrade it or buy extended maintenance. The kiosk is supported
until 2032 but nobody watches it. And `nas-crew` is the worst: nobody knows what it runs or who
owns it.

## Operating systems, virtualization and zero-days

- **OS-based** vulnerabilities live in the kernel, drivers and default services. A local flaw
  turns a foothold as an ordinary user into administrator or root (privilege escalation, next
  lesson). Harden baselines, remove unneeded services, patch.
- **Virtualization**: the hypervisor separates virtual machines, so a flaw that lets code in a VM
  run on the host (**VM escape**) breaks every boundary at once. CVE-2025-22224, a
  time-of-check/time-of-use race in VMware ESXi and Workstation, lets a VM's administrator run
  code as the VMX process on the host; CISA added it to KEV on 4 March 2025. Other risks: **VM
  sprawl** (forgotten, unpatched machines) and resource reuse, where memory or disk from one tenant
  is handed to another without being cleared.
- **Zero-day**: a vulnerability attackers exploit before the vendor has a fix (the vendor has had
  zero days to respond). The MOVEit Transfer SQL injection, CVE-2023-34362, was exploited in May
  2023 before its patch existed. A patch cannot help, so defense in depth must: segmentation,
  least privilege, monitoring for unusual behavior, and fast emergency mitigation.
- **Cryptographic vulnerabilities** (weak algorithms, short keys, reused nonces, downgrades) were
  covered in Security Foundations; they belong on this list too.

## Credentials, rogue devices and shadow IT

- **Unmanaged or stale credentials**: accounts of people who left, service accounts whose
  passwords never change, API keys in old scripts. In the 2024 Snowflake thefts, some stolen
  credentials dated from infostealer infections in 2020 and still worked. Review accounts, rotate
  secrets, disable on departure.
- **Rogue devices**: equipment connected without approval, such as a personal wireless access point
  under a desk or a small computer plugged into a meeting-room port. Network access control
  (802.1X) and switch-port monitoring find and block them.
- **Shadow IT**: services adopted without IT's knowledge, such as a team's own file-sharing or AI
  account. Data goes where no policy, backup or log follows it. Offer approved tools and discover
  the rest through proxy and DNS logs.

## Wireless and low-power communications

Wi-Fi with WEP, WPA2 with a short shared passphrase, or WPS (Wi-Fi Protected Setup) PIN entry can
be broken from the car park. Low-power links used by sensors, locks and badges, such as Bluetooth
Low Energy, Zigbee and LoRaWAN, may run with default keys or weak pairing, and the devices are
rarely updated. Use WPA3 or WPA2-Enterprise with 802.1X, disable WPS, and
inventory every radio device like any other asset.

## Identity providers and mobile devices

An **identity provider** (IdP) such as Microsoft Entra ID or Okta issues the tokens every other
service trusts, so compromising it compromises everything. In 2023 the China-based actor
Storm-0558 used a stolen Microsoft consumer signing key to forge tokens that Exchange Online
accepted, reading mailboxes of US government agencies; the Cyber Safety Review Board found in
March 2024 that the intrusion was preventable. Protect IdP administrators with phishing-resistant
MFA, monitor token issuance and configuration changes, and protect signing keys in hardware.

**Mobile devices** add rooted or jailbroken phones, apps installed from outside the official
stores (sideloading), outdated OS versions and lost devices. Mobile device management (MDM)
enforces encryption, screen locks, updates and remote wipe.

## Misconfiguration, public storage and public repositories

**Misconfiguration** is the most common cloud weakness: default passwords, management interfaces
open to the internet, overly broad permissions, logging turned off. **Public object storage**
is its classic form. This bucket policy makes every object in the bucket readable by anyone on
the internet:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicRead",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::ferry-crew-rosters/*"
  }]
}
```

`"Principal": "*"` means everyone. Since April 2023 AWS turns on S3 Block Public Access and
disables access control lists for every new bucket, so such a policy is refused unless someone
switched the protection off. Older buckets keep their old settings, so audit them.

**Public repositories** leak secrets: a key committed once stays in the history even after the
file is fixed. A simple search finds the classic patterns (the AWS key below is the example from
AWS's documentation):

```bash
grep -nE 'AKIA[0-9A-Z]{16}|(SECRET|PASSWORD|TOKEN)[A-Z_]* *= *"[^"]{8,}"' settings.py
```

```text
2:AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE"
3:AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
```

The fix is to **revoke and rotate** the secret at once (deleting the commit is not enough, since
copies and forks exist), then move secrets to a vault or environment variables and turn on secret
scanning; GitHub's push protection blocks pushes that contain recognized secrets.

## Common mistakes

- Counting only the assets in the inventory; the unmanaged ones are the problem.
- Waiting for a patch for a zero-day instead of applying the vendor's mitigation now.
- Removing a leaked key from the repository but not revoking it.
- Turning off Block Public Access account-wide to share one file.

## Practice

1. Which inventory finding above is most urgent, and why?
2. A vendor's appliance runs an OS the vendor no longer updates, but the production line needs it.
   What category is it, and what do you do?
3. A developer pushed `AKIA...` to a public repository ten minutes ago and has already deleted the
   file. Is the incident over?
4. Why is an identity provider a larger attack surface than any single application?

### Answers

1. `nas-crew`: unknown OS, no agent and no owner, so nobody patches or watches it, and it may hold
   crew personal data. (srv-ticket is a close second.)
2. Obsolete (and unsupported). Isolate it on its own segment, allow only the traffic it needs,
   monitor it, and plan its replacement.
3. No. Automated scanners watch public repositories continuously, and the commit is still in
   the history. Revoke the key, review its activity in the
   cloud logs, and issue a new one through a secrets manager.
4. Every connected application trusts the tokens it issues, so one compromise opens all of them.

## Key takeaways

- Unsupported, unpatched, obsolete and unmanaged systems are found through inventory.
- VM escape and zero-days defeat a single control; defense in depth limits the damage.
- Stale credentials, rogue devices, shadow IT and radio links widen the surface quietly.
- Identity providers and mobile devices need their own protection.
- Misconfiguration, public buckets and leaked secrets are fixed by defaults, scanning and rotation.

## Further reading

- [CISA: Known Exploited Vulnerabilities catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog)
- [AWS: S3 Block Public Access and ACLs disabled by default for new buckets](https://aws.amazon.com/about-aws/whats-new/2022/12/amazon-s3-automatically-enable-block-public-access-disable-access-control-lists-buckets-april-2023/)
- [GitHub Docs: About push protection](https://docs.github.com/en/code-security/secret-scanning/introduction/about-push-protection)
- [Microsoft Lifecycle: Windows 11 Home and Pro](https://learn.microsoft.com/en-us/lifecycle/products/windows-11-home-and-pro)
