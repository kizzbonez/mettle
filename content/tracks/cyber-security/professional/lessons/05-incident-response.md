---
title: Incident Response
summary: Handle a security incident from preparation to lessons learned (SY0-801 objective 4.7). Prepare with roles, playbooks, training, tabletop exercises and simulations; identify, investigate and contain; handle extortion and negotiation; eradicate and recover; notify stakeholders, customers, regulators and law enforcement; and close with root cause analysis and a post-incident report, mapped to NIST SP 800-61 Rev. 3 and CSF 2.0.
minutes: 40
objectives:
  - Explain the incident response phases named by SY0-801 and map them to the CSF 2.0 model of NIST SP 800-61 Rev. 3
  - Prepare a response capability with roles, playbooks, training, tests, tabletop exercises and simulations
  - Choose containment, eradication and recovery actions and know when negotiation and law enforcement are involved
  - Plan notification and external reporting and run lessons learned, root cause analysis and the post-incident report
---

## Outline

1. Events, incidents and the life cycle
2. Preparation
3. Identification
4. Investigation
5. Containment
6. Negotiation
7. Eradication and recovery
8. Notification and external reporting
9. Post-incident activity

This lesson covers SY0-801 objective 4.7.

## Events, incidents and the life cycle

An **event** is any observable occurrence, such as a logon or a software update. NIST SP 800-61
Rev. 3 (April 2025) defines a **cybersecurity incident** as an occurrence that actually or
imminently jeopardizes, without lawful authority, the confidentiality, integrity or availability
of information or a system, or that violates (or imminently threatens to violate) law, security
policies or acceptable use policies.

The 2012 revision drew response as a circle: preparation; detection and analysis; containment,
eradication and recovery; post-incident activity. Rev. 3 observes that incidents are now frequent
and can take weeks or months, and maps the old phases onto the six CSF 2.0 Functions:

```text
Previous SP 800-61 phase                 CSF 2.0 Functions (SP 800-61 Rev. 3, Table 1)
Preparation                              Govern, Identify (all Categories), Protect
Detection & Analysis                     Detect, Identify (Improvement)
Containment, Eradication & Recovery      Respond, Recover, Identify (Improvement)
Post-Incident Activity                   Identify (Improvement)
```

Lessons learned feed **Improvement** (ID.IM) continuously, not only at the end. SY0-801 names
the work as preparation, identification, investigation, containment, negotiation, eradication
and recovery, notification and external reporting, and post-incident activity; this lesson
follows that order.

## Preparation

- **Roles**: leadership (decides high-impact actions such as shutting a service down), incident
  handlers (internal, contracted or on call), technology staff, legal, public relations, human
  resources (HR), physical security and asset owners. Name an **incident commander** and a
  deputy for each incident, and keep an out-of-band contact list.
- **Playbooks**: step-by-step procedures for common incident types (ransomware, account
  takeover, lost laptop, data exposure) with decision points and owners.
- **Training** for handlers and for everyone who reports or decides.
- **Testing** of tools and procedures: can we isolate a host? Restore a backup in time?
- **Tabletop exercises**: a facilitated discussion of a scenario around a table, with no systems
  touched, which tests decisions, roles and communication.
- **Simulations**: hands-on exercises in a lab or a controlled part of production, such as a
  red team or a simulated ransomware outbreak, which test people and tools for real.

A playbook excerpt:

```yaml
playbook: ransomware-suspected
owner: SOC manager
severity_rule: "any encryption activity on a server is SEV-1"
steps:
  - id: R1
    do: Isolate affected hosts with EDR network containment (keep them powered on)
    who: on-call analyst
  - id: R2
    do: Disable accounts seen in the activity; reset their credentials out of band
    who: identity team
  - id: R3
    do: Capture memory and EDR telemetry before any rebuild
    who: forensics lead
  - id: R4
    do: Brief incident commander, legal and communications within 60 minutes
    who: incident commander
  - id: R5
    do: Confirm backups are intact and offline before any restore decision
    who: infrastructure lead
decision_points:
  - "Data exfiltration suspected? Legal assesses notification duties"
  - "Extortion demand received? Executive, legal and outside counsel decide; no one replies alone"
```

## Identification

**Detection** comes from monitoring (SIEM alerts, EDR, DLP, users reporting). **Internal
advisories** share what the organization learned with its own staff; **external advisories**
arrive from CISA, vendors, information sharing and analysis centers (ISACs) and partners.
**Threat hunting** searches proactively for activity that no alert caught, starting from a
hypothesis ("an attacker using the new VPN flaw would leave sessions from unusual countries").
Identification ends with a decision: is this an incident, how severe, and who leads?

## Investigation

Investigation establishes scope and cause: which hosts, accounts and data, since when, and how
the attacker entered. It relies on **digital forensics**, a **chain of custody** for evidence,
**preservation** of logs and images, and **e-discovery** when litigation follows; lesson 6
covers these. The first product is a **timeline** built from every source, normalized to UTC:

```bash
{
  while read -r d t z host rest; do
    echo "$(date -u -d "$d $t $z" +%FT%TZ) vpn   $host $rest"
  done < vpn.log
  jq -r '"\(.ts) edr   \(.host) \(.event): \(.detail)"' edr.jsonl
  while read -r epoch host rest; do
    echo "$(date -u -d "@$epoch" +%FT%TZ) proxy $host $rest"
  done < proxy.log
} | sort
```

```text
2026-10-14T01:41:07Z vpn   vpn-01 login ok user=j.okafor src=203.0.113.200
2026-10-14T01:52:30Z edr   lt-fin-031 process: powershell.exe -enc ... spawned by outlook.exe
2026-10-14T01:52:41Z proxy lt-fin-031 GET https://cdn-update.example.net/a.bin 200 1843200
2026-10-14T02:05:12Z edr   srv-file-02 file: 3,184 files renamed to *.lockd in 4 minutes
```

The VPN logged local time (+0200), the proxy Unix seconds, and the EDR UTC; only after
normalizing does the sequence appear: a VPN logon, an encoded PowerShell started by Outlook,
a download, then mass renaming on a file server.

## Containment

Containment stops the spread while preserving evidence. **Isolation** cuts a host off from the
network (EDR containment, a quarantine VLAN) while leaving it running, so memory survives;
**quarantine** moves a file, message or device to a controlled holding area. Also disable
compromised accounts, block indicators at the firewall and proxy, and segment affected networks.
Containment involves trade-offs: acting too early may alert the attacker before the full scope
is known, and acting too late lets damage grow. Leadership, guided by the playbook, decides.

## Negotiation

Extortion (ransomware, or a threat to publish stolen data) may lead to contact with the
attacker. Negotiation is a business and legal decision made by executives with legal counsel and
often a specialist firm, never by an analyst alone. The FBI does not support paying ransoms,
payment does not guarantee a working decryptor or deletion of the data, and the US Treasury's
Office of Foreign Assets Control (OFAC) warns that paying a sanctioned group can violate
sanctions; it treats prompt reporting to law enforcement and full cooperation as significant
mitigating factors.

## Eradication and recovery

**Eradication** removes the attacker: malware, persistence (scheduled tasks, new accounts,
web shells), stolen credentials (reset them, including service accounts and keys) and the
vulnerability they used. **Recovery** restores service: rebuild from known-good images, restore
data from backups checked to be clean, return systems in stages, and watch them closely for
reinfection. Recovery follows the recovery plan and its recovery time objectives.

## Notification and external reporting

SP 800-61 Rev. 3 recommends notifying in line with the laws, regulations and contracts that
apply, and informing HR when an insider is involved. Plan who tells whom:

```text
Audience                  Owner                 Trigger and deadline (examples)
Executives, board         Incident commander    SEV-1 within 1 hour, then daily updates
Stakeholders and staff    Communications        After containment; agreed wording only
Customers                 Legal + comms         When their data or service is affected
Supervisory authority     Data protection lead  GDPR Art. 33: 72 hours after awareness of a personal data breach
Investors (US listed)     Legal                 SEC Form 8-K Item 1.05: 4 business days after deciding it is material
Law enforcement           Legal                 Per plan and management approval
Cyber insurer             Risk manager          Per policy notice clause, often before engaging vendors
```

**Mandatory** reporting comes from regulation and contracts; voluntary sharing (an ISAC, CISA)
helps others defend.

## Post-incident activity

- **Lessons learned**: a blameless review soon after the incident, asking what happened, what
  worked, what did not and what to change.
- **Root cause analysis (RCA)**: the underlying cause, not the symptom. "A user opened an
  attachment" is a symptom; "macros from the internet were allowed and the account had local
  administrator rights" is closer to the cause. Asking "why?" repeatedly helps.
- **Post-incident report (PIR)**: summary, timeline, impact, root cause, actions taken, and
  improvements with owners and due dates, tracked until closed.

## Common mistakes

- Powering off an infected server and losing the memory evidence.
- Rebuilding before scoping, so a second foothold survives.
- Resetting passwords while the attacker still controls a mailbox rule or token.
- Letting an analyst reply to an extortion message.
- Writing a PIR whose actions have no owner or date.

## Practice

1. Sort these into SY0-801 phases: a tabletop on a supplier breach; an EDR alert analyzed;
   moving a laptop to a quarantine VLAN; reimaging servers; a 72-hour GDPR report.
2. Why keep an isolated host running?
3. Name a symptom and a root cause for an incident where an old VPN account was used to log in.

### Answers

1. Preparation; identification; containment; eradication and recovery; notification and
   external reporting.
2. Memory holds processes, network connections and keys that disappear at power-off.
3. Symptom: an attacker logged in with a former contractor's account. Root cause: deprovisioning
   did not disable contractor accounts, and the VPN did not require MFA.

## Key takeaways

- SP 800-61 Rev. 3 maps incident response onto CSF 2.0 with continuous improvement.
- Prepare roles, playbooks, training, tests, tabletops and simulations before you need them.
- Contain with isolation and quarantine while preserving evidence; executives decide negotiation.
- Notify by plan and by law; close with lessons learned, root cause and a tracked PIR.

## Further reading

- [NIST SP 800-61 Rev. 3, Incident Response Recommendations and Considerations](https://csrc.nist.gov/pubs/sp/800/61/r3/final)
- [CISA Federal Incident and Vulnerability Response Playbooks](https://www.cisa.gov/resources-tools/resources/federal-government-cybersecurity-incident-and-vulnerability-response-playbooks)
- [SEC Cybersecurity Disclosure Small Business Compliance Guide](https://www.sec.gov/resources-small-businesses/small-business-compliance-guides/cybersecurity-risk-management-strategy-governance-incident-disclosure)
