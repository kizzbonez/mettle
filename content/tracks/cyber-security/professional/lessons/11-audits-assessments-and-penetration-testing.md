---
title: Audits, Assessments and Penetration Testing
summary: Plan and use audits, assessments and penetration tests (SY0-801 objective 5.5). Gather evidence by sampling, questionnaires, interviews and testing assertions, use MITRE ATT&CK, the Cyber Kill Chain and the Diamond Model, scope work with an audit charter, choose internal, external and benchmarking engagements, and run penetration testing as an authorized engagement with rules of engagement, reconnaissance phases and a report.
minutes: 40
objectives:
  - Gather audit evidence with sampling, questionnaires, interviews and tests of management assertions
  - Use MITRE ATT&CK, the Cyber Kill Chain and the Diamond Model to frame testing and analysis
  - Distinguish gap analyses, internal and external audits, examinations, assessments and benchmarking, scoped by an audit charter
  - Explain penetration test types, rules of engagement, passive and active reconnaissance and reporting, plus functional and behavioral testing
---

## Outline

1. Audits and assessments
2. Scoping
3. Data gathering
4. Reference sources
5. Engagement types
6. Penetration testing as a managed engagement
7. Frameworks and standards
8. Functional and behavioral testing

This lesson covers SY0-801 objective 5.5.

## Audits and assessments

An **audit** is an independent, evidence-based examination of whether controls meet stated
criteria (a policy, a standard, a regulation), ending in findings or a formal opinion. An
**assessment** evaluates controls or risk, often less formally and sometimes by the team
itself. Both answer the same question: does the control exist, and does it work?

## Scoping

Internal audit works under an **audit charter**, a document approved by the board or its audit
committee that sets the function's purpose, its authority (access to all records, people and
systems), its independence and its reporting line. Each engagement then has a scope: which
systems, processes, locations and period. **Frequency** follows risk and obligation: an annual
plan weighted to the riskiest areas, the cycles regulators and standards demand (PCI DSS
assessments are annual), and extra reviews after major changes or incidents.

## Data gathering

- **Assertion**: management states that a control works ("every leaver's access is removed
  within 24 hours"). Auditors test assertions; they do not take them on trust.
- **Sampling**: testing every item is rarely possible, so auditors test a sample. A
  **statistical** sample is random, so it represents the population; a **judgmental** sample adds
  items chosen for their risk. Recording the seed makes a random sample reproducible.
- **Questionnaires and surveys** collect answers from many control owners quickly.
- **Interviews** show how people really perform a process, and where documents and practice
  differ.

```python
import random

# Population: the 412 access-change tickets closed in Q3 (CHG-30001 to CHG-30412).
population = [f"CHG-{n}" for n in range(30001, 30413)]
privileged = {"CHG-30017", "CHG-30188", "CHG-30349"}    # changes to admin groups

rng = random.Random(20261016)            # the seed is written in the workpapers
statistical = sorted(rng.sample(population, 25))
judgmental = sorted(privileged - set(statistical))  # every privileged change, too

print(len(population), "tickets; random sample of", len(statistical))
print(statistical[:6], "...")
print("added by judgment:", judgmental)
print("same seed, same sample:", sorted(random.Random(20261016).sample(population, 25)) == statistical)
```

```text
412 tickets; random sample of 25
['CHG-30028', 'CHG-30051', 'CHG-30069', 'CHG-30086', 'CHG-30090', 'CHG-30119'] ...
added by judgment: ['CHG-30017', 'CHG-30188']
same seed, same sample: True
```

`CHG-30349` was already drawn at random, so judgment adds the other two privileged changes.

## Reference sources

- **MITRE ATT&CK** is a knowledge base of adversary behavior observed in real intrusions,
  organized as **tactics** (the adversary's goal, such as Initial Access or Exfiltration) and
  **techniques** (how, such as T1110.003 Password Spraying). Version 20 of the Enterprise matrix
  lists 15 tactics, from Reconnaissance to Impact. Testers map what they did to techniques, and
  defenders map detections to them, which shows coverage and gaps in a common language.
- The **Cyber Kill Chain** (Lockheed Martin) describes an intrusion in seven phases:
  reconnaissance, weaponization, delivery, exploitation, installation, command and control, and
  actions on objectives. Breaking any link stops the attack, and earlier is cheaper.
- The **Diamond Model of Intrusion Analysis** (Caltagirone, Pendergast and Betz, 2013) describes
  every intrusion event by four connected features: **adversary**, **capability**,
  **infrastructure** and **victim**. Knowing one lets an analyst pivot to the others, for
  example from a command-and-control server to other victims using it.

## Engagement types

- **Gap analysis**: compare the current state with a target framework (say, before seeking
  ISO/IEC 27001 certification) and list what is missing.
- **Internal**: **compliance** reviews against obligations, work overseen by the board's
  **audit committee**, and **self-assessments** in which control owners rate their own controls.
- **External**: **examinations** by regulators (a banking supervisor's examiners), **assessments**
  by qualified outsiders (a PCI Qualified Security Assessor), **regulatory** audits required by
  law, and **independent third-party audits** such as a SOC 2 or an ISO/IEC 27001 certification
  audit. Independence is what gives their results weight with customers and regulators.
- **Benchmarking**: comparing your controls or metrics with peers, industry data or a benchmark
  configuration.

## Penetration testing as a managed engagement

A **penetration test** is an authorized, time-boxed attempt to find and demonstrate exploitable
weaknesses, so they can be fixed. Without written authorization from the system owner it is a
crime, however good the intent.

By the tester's starting knowledge:

- **Known environment**: full information (diagrams, accounts, source code); thorough and
  efficient.
- **Unknown environment**: no information, like an outside attacker; realistic but may miss
  depth.
- **Partially known environment**: some information, such as a standard user account, which
  tests what an insider or a phished user could reach.

**Physical** penetration tests check locks, badges, reception and whether staff challenge
strangers, under the same written authorization. By role, **offensive** testing (a red team)
attacks, **defensive** work (a blue team) detects and responds, and **integrated** testing (a
purple team) runs both together, sharing each step so detections improve during the exercise.

NIST SP 800-115 describes four phases: planning, discovery, attack and reporting. **Planning**
produces the **rules of engagement**:

```yaml
engagement: PT-2026-07 external and partially known internal test
authorized_by: CIO (signed 2026-10-01); hosting provider notified 2026-10-02
scope:
  in: [203.0.113.0/27, portal.example.com, 10.40.0.0/16 from the supplied VPN account]
  out: [payment processor systems, third-party SaaS, production database writes]
window: 2026-10-19 to 2026-10-30, 08:00-18:00 UTC; no testing during month-end close
allowed: reconnaissance, scanning, exploitation to prove impact, one test account
forbidden: denial of service, social engineering, changing or deleting data, persistence after window
data: stop and report on finding personal data; no data leaves the test laptop
stop: tester calls the 24/7 contact if a system becomes unstable or a prior compromise is found
contacts: {client: soc-lead@example.com +1-555-0144, tester: pt-lead@tester.example}
deliverables: draft report 2026-11-06; retest of critical findings within 30 days
```

**Discovery** begins with **reconnaissance**:

- **Passive reconnaissance** gathers information without touching the target's systems: public
  DNS records, certificate transparency logs, the company website, job postings, social media
  and data breach disclosures. It produces lists of domains, hostnames, technologies in use,
  staff names and email formats, and the target cannot see it.
- **Active reconnaissance** interacts with the target: discovering live hosts, scanning ports,
  identifying services and versions, and vulnerability scanning. It produces lists of live
  systems, open ports, service versions and candidate weaknesses, appears in the target's logs,
  and can disturb fragile systems, so it happens only within scope and window.

The **attack** phase tries to confirm and exploit the candidates within the rules, to show real
impact. **Reporting** gives an executive summary, scope and method, and each finding with
severity, evidence, affected assets, an ATT&CK mapping and a fix:

```text
Finding PT-2026-07-03                                     Severity: High
Title:    Password spraying succeeded against the VPN portal (no MFA on legacy profile)
ATT&CK:   T1110.003 Password Spraying (Credential Access); T1133 External Remote Services (Initial Access)
Evidence: 1 of 212 tested accounts accepted a common seasonal password; access stopped at login
Detected? No alert raised (SIEM rule covers Windows logons only, not the VPN log source)
Fix:      Require MFA on all VPN profiles; add the VPN source to rule 3a8e6f51; blocklist common passwords
Retest:   Required
```

## Frameworks and standards

**Industry-based** standards apply to a sector, such as PCI DSS for card payments. **International**
standards apply anywhere, such as ISO/IEC 27001 (requirements for an information security
management system) and ISO/IEC 27002 (control guidance). **Region-specific** standards serve one
country or region, such as the UK's Cyber Essentials, Germany's BSI IT-Grundschutz or
Australia's Essential Eight. Audits test against whichever the organization must or chooses to
meet.

## Functional and behavioral testing

**Functional testing** checks that a control does what its specification says: the VPN demands
MFA, the account locks after the configured failures, a backup actually restores. **Behavioral
testing** observes how people and systems really act under realistic conditions: whether staff
report a simulated phishing email, challenge an unbadged visitor, or whether an application
behaves safely when given unexpected input. A control can pass the first and fail the second.

## Common mistakes

- Starting any test without written authorization and agreed rules of engagement.
- Treating a management assertion as evidence.
- Drawing a "random" sample that nobody can reproduce.
- Reading an unknown-environment test with no findings as proof of security.
- Filing the report without retesting the fixes.

## Practice

1. Which reconnaissance type is reading certificate transparency logs for a target's
   subdomains, and which is scanning its address range?
2. The tester gets a normal user account and VPN access. What type of test is it?
3. Map to the Diamond Model: a phishing kit, the victim's finance team, a look-alike domain, a
   criminal group.

### Answers

1. Passive; active.
2. A partially known environment test.
3. Capability; victim; infrastructure; adversary.

## Key takeaways

- Audits test controls against criteria under a charter, at a risk-based frequency.
- Gather evidence by sampling, questionnaires and interviews, and test every assertion.
- ATT&CK, the Kill Chain and the Diamond Model give a shared language for attacks and defenses.
- Penetration testing is authorized and scoped: plan, reconnoiter, attack within rules, report, retest.

## Further reading

- [NIST SP 800-115, Technical Guide to Information Security Testing and Assessment](https://csrc.nist.gov/pubs/sp/800/115/final)
- [MITRE ATT&CK Enterprise Tactics](https://attack.mitre.org/tactics/enterprise/)
- [Lockheed Martin Cyber Kill Chain](https://www.lockheedmartin.com/en-us/capabilities/cyber/cyber-kill-chain.html)
- [The Diamond Model of Intrusion Analysis (DTIC)](https://apps.dtic.mil/sti/pdfs/ADA586960.pdf)
