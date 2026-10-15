---
title: Governance Documents
summary: Write and maintain the documents that govern a security program (SY0-801 objective 5.1). Tell policies, standards, procedures, guidelines and plans apart, know the common policies from acceptable use to vulnerability disclosure and privacy, use benchmarks, advisories, implementation guides and reference architectures, and keep every document owned, reviewed and enforced.
minutes: 35
objectives:
  - Distinguish policies, standards, procedures, guidelines and plans by purpose, authority and level of detail
  - Describe the purpose and typical content of each common security policy
  - Use baselines, password, physical security and encryption standards, RFCs, SOPs and runbooks correctly
  - Keep governance documents owned, approved, versioned, reviewed and acknowledged
---

## Outline

1. Why governance documents matter
2. The hierarchy
3. Policies
4. Standards
5. Procedures: SOPs and runbooks
6. Guidelines
7. Plans
8. Keeping documents alive

This lesson covers SY0-801 objective 5.1.

## Why governance documents matter

Controls without documents depend on whoever happens to be on shift. Governance documents
record what management requires, so that people act consistently, auditors can test against a
stated rule, and staff know the consequences of breaking it. The Govern function of NIST CSF 2.0
asks for exactly this: policy for managing cybersecurity risk is "established, communicated, and
enforced" (GV.PO-01) and "reviewed, updated, communicated, and enforced" as requirements,
threats and technology change (GV.PO-02).

## The hierarchy

| Document | Says | Mandatory? | Changes |
| --- | --- | --- | --- |
| Policy | what and why: management's intent and rules | yes | rarely; approved by senior management |
| Standard | the specific requirement that meets the policy | yes | when technology changes |
| Procedure | how, step by step | yes | whenever the steps change |
| Guideline | recommended practice and advice | no | freely |
| Plan | what to do in a defined situation, by whom | yes, when invoked | after tests and real events |

A policy says "data in transit must be encrypted"; the encryption standard says which protocols
and algorithms; a procedure says how to request and install a certificate; a guideline suggests
how to choose between two approved options.

## Policies

- **Information security policy**: the umbrella document. Scope, management commitment, roles,
  and the other policies it relies on.
- **Acceptable use policy (AUP)**: what users may and may not do with organizational systems,
  data and accounts, and notice that use is monitored. Users acknowledge it before receiving
  access.
- **Bring your own device (BYOD)**: conditions for using personal phones and laptops, such as
  enrollment in mobile device management or app protection, separation of work data, remote wipe
  of work data only, minimum OS versions, and what the organization will not see on the device.
- **Clean desk**: no sensitive papers or removable media left out, screens locked when away,
  locked drawers and shredding bins.
- **Incident response**: authority, definitions, the duty to report, severity levels and the
  team's mandate; plans and playbooks implement it.
- **Data classification and retention**: the classification levels and how each is handled, and
  how long each record type is kept before disposal.
- **Access control**: least privilege, approval of access, MFA, periodic access reviews and
  prompt deprovisioning.
- **Data disposal**: how media and records are sanitized or destroyed for each classification,
  with certificates (lesson 1).
- **Vulnerability disclosure**: how outsiders report weaknesses and what the organization
  promises them (lesson 2).
- **Privacy**: what personal data is collected and why, how it is used, shared and retained, and
  how people exercise their rights (lesson 10).

An excerpt of a policy, short and technology-neutral:

```text
ACCEPTABLE USE POLICY  POL-004  v3.1  Owner: CISO  Approved by: Executive Committee 2025-11-02

4.1  Company systems are provided for business use. Limited personal use is allowed if it does
     not interfere with work, break the law or breach any other policy.
4.2  Users must not share their credentials, disable security software, or connect
     unapproved devices or services to company systems.
4.3  Company systems and accounts are monitored for security and compliance purposes.
4.4  Breaches of this policy may lead to disciplinary action up to and including dismissal.
```

## Standards

Standards turn policy into measurable requirements:

- **Baselines**: the minimum configuration for each system type, usually adapted from a CIS
  Benchmark, and checked by SCAP scans (lesson 3).
- **Passwords**: current guidance is NIST SP 800-63B-4: at least 15 characters when a password
  is the only factor (8 when it is part of MFA), allow at least 64, no composition rules, no
  periodic forced changes, but a forced change on evidence of compromise and a check against a
  blocklist of common and breached passwords.
- **Physical security**: badge access, visitor escort, camera coverage and retention.
- **Requests for Comments (RFCs)**: the Internet Engineering Task Force's published technical
  standards, which internal standards cite, such as TLS 1.3 (RFC 8446) and the TLS
  recommendations of RFC 9325.
- **Encryption**: approved algorithms, key lengths, protocols and key management.

```yaml
standard: STD-010 Encryption Standard   # implements POL-001 section 7
version: 2.0
in_transit:
  protocols: [TLS 1.3, TLS 1.2]          # per RFC 9325; SSL, TLS 1.0 and 1.1 prohibited
  tls12_ciphers: ECDHE with AES-GCM or ChaCha20-Poly1305 only
at_rest:
  algorithm: AES-256 (XTS for disks, GCM for application data)
  modules: FIPS 140-3 validated where regulation requires
keys:
  storage: key management service or HSM; never in source code
  rotation: data keys yearly; immediately on suspected compromise
exceptions: approved by the CISO, recorded in the risk register, maximum 12 months
```

## Procedures: SOPs and runbooks

A **standard operating procedure (SOP)** describes a routine task the same way every time:
onboarding a user, verifying backups, offboarding a leaver. A **runbook** gives the operational
steps for one system or event, such as failing over a database or answering a specific alert,
and is often partly automated:

```text
RUNBOOK RB-SOC-014  Alert: "Password spraying from one source" (SIEM rule 3a8e6f51)
1. Open the alert; note source IP, target account count and time window.
2. Look up the source: known scanner (asset list) or VPN pool? If yes, record and close as benign.
3. Query sign-ins from the source for any success in the window.
4. Any success: disable that account, revoke its sessions, escalate to IR on-call (SEV-2).
5. No success: block the source at the edge for 24 hours; ticket to the identity team.
6. Record actions and times in the ticket.
```

## Guidelines

Guidelines advise rather than command: **benchmarks** (CIS Benchmarks), **advisories** (CISA and
vendor security advisories that tell you what to patch or watch), **implementation guides**
(vendor hardening guides, NIST practice guides) and **reference architectures** (tested
designs, such as NIST SP 800-207 for zero trust). Once adopted, a guideline's content often
becomes a standard.

## Plans

A **business continuity plan (BCP)** keeps critical business functions running during a
disruption, with alternate processes, people and sites. A **disaster recovery plan (DRP)**
restores IT systems and data after a disaster, in priority order and within the recovery time
and recovery point objectives (RTO and RPO). Both are tested and updated after every test and
real incident.

## Keeping documents alive

Every document has an owner, an approver, a version, an effective date and a review cycle,
annual or after any major change, plus an **exception** process. People acknowledge the policies
that apply to them, and training explains them. A register makes overdue reviews visible:

```bash
today=2026-10-16
tail -n +2 documents.csv | while IFS=, read -r id title type owner approved months; do
  due=$(date -d "$approved +$months months" +%F)
  if [[ "$due" < "$today" ]]; then
    printf '%-8s %-38s review was due %s (owner: %s)\n' "$id" "$title" "$due" "$owner"
  fi
done
```

```text
POL-004  Acceptable Use Policy                  review was due 2025-11-02 (owner: CISO)
STD-012  Password and Authentication Standard   review was due 2024-06-01 (owner: Identity Team)
PRO-031  User Offboarding Procedure             review was due 2026-07-20 (owner: IT Service Desk)
```

A password standard not reviewed since 2023 may still demand 90-day changes that NIST no longer
recommends.

## Common mistakes

- Writing product names and settings into a policy, so it must change with every upgrade.
- Calling a guideline mandatory, or treating a standard as optional advice.
- Policies nobody has read or acknowledged, which cannot be enforced fairly.
- Exceptions granted by email with no expiry and no record.
- Never testing the BCP and DRP.

## Practice

1. Classify: "All laptops must use full-disk encryption"; "Use BitLocker with XTS-AES 256 and
   TPM plus PIN"; "Steps to enable BitLocker on a new laptop"; "Consider a longer PIN for
   travelers".
2. Which policy covers a contractor's personal phone reading company email?
3. Your password standard requires changes every 90 days. What should replace that rule?

### Answers

1. Policy; standard; procedure; guideline.
2. The BYOD policy (with the AUP and access control policy).
3. No periodic expiry; at least 15 characters for single-factor passwords; a blocklist check of
   common and breached passwords; forced change only on evidence of compromise.

## Key takeaways

- Policies state intent; standards make it specific; procedures say how; guidelines advise.
- Know each common policy's purpose, from AUP and BYOD to disclosure and privacy.
- SOPs cover routine tasks; runbooks cover a system or event; BCP and DRP cover disruption.
- Every document needs an owner, approval, version, review date, exceptions and acknowledgement.

## Further reading

- [NIST Cybersecurity Framework 2.0 (CSWP 29)](https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.29.pdf)
- [NIST SP 800-63B-4, Authentication and Authenticator Management](https://pages.nist.gov/800-63-4/sp800-63b.html)
- [SANS Security Policy Templates](https://www.sans.org/information-security-policy)
- [RFC 9325: Recommendations for Secure Use of TLS and DTLS](https://www.rfc-editor.org/rfc/rfc9325.html)
