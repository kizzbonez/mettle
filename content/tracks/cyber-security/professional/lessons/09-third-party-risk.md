---
title: Third-Party Risk Management
summary: Assess and manage the risk that suppliers, SaaS providers and service providers bring (SY0-801 objective 5.3). Select vendors through RFIs, EOIs, RFPs and RFQs with due diligence and conflict-of-interest checks, choose the right agreement (MSA, SOW, SLA, SLO, MOU, MOA, NDA), monitor vendors with audits, attestations and a registry, respect the limits of what you can verify, and set rules of engagement.
minutes: 35
objectives:
  - Explain RFI, EOI, RFP and RFQ, and what due diligence and conflict-of-interest checks involve
  - Choose among MSA, SOW, SLA, SLO, MOU, MOA and NDA, and compute what an availability target allows
  - Monitor vendors with a registry, tiered reassessment, right to audit, service-level monitoring, attestations and testing
  - Explain the constraints on third-party assurance and the rules of engagement for testing a vendor
---

## Outline

1. Your vendors' risk is your risk
2. Vendor selection
3. Agreement types
4. Vendor monitoring
5. Limitations and constraints
6. Rules of engagement

This lesson covers SY0-801 objective 5.3.

## Your vendors' risk is your risk

Payroll runs in a SaaS application, a managed service provider (MSP) administers the servers,
a partner receives customer addresses through an API. Each third party holds your data or access
to your systems, so its weaknesses become yours: in 2023 attackers mass-exploited the MOVEit
Transfer file-sharing product (CVE-2023-34362), and many organizations lost data through vendors
that ran it. NIST CSF 2.0 gives supply chain risk its own Category (GV.SC): suppliers "are known
and prioritized by criticality" (GV.SC-04), due diligence happens before the relationship
(GV.SC-06), and risks are monitored throughout it (GV.SC-07). NIST SP 800-161 Rev. 1 is the
detailed guide.

## Vendor selection

The buying documents run from open questions to firm prices:

- **Request for information (RFI)**: early market research. What solutions exist, and how do
  they handle encryption, logging and single sign-on?
- **Expression of interest (EOI)**: vendors state that they want to bid and show their
  capability, which lets the buyer build a shortlist.
- **Request for proposal (RFP)**: the buyer describes the need and its requirements, including
  security requirements, and vendors propose a solution and price.
- **Request for quote (RFQ)**: the requirements are fixed, and vendors quote prices for them.

**Due diligence** checks a candidate before signing: a security questionnaire, independent
evidence such as a SOC 2 report or an ISO/IEC 27001 certificate (and its scope), recent
penetration test summaries, breach history, financial stability, sanctions screening, where data
will be stored, and which subcontractors (fourth parties) the vendor uses. A **conflict of
interest**, such as an evaluator who holds shares in a bidder or is related to its staff, must
be declared, and that person steps out of the decision.

## Agreement types

- **Master services agreement (MSA)**: the umbrella terms for all future work: liability,
  confidentiality, data protection, security requirements, breach notification, right to audit.
- **Statement of work (SOW)**: one specific piece of work under the MSA, with deliverables,
  timeline, price and acceptance criteria.
- **Service-level agreement (SLA)**: measurable service levels and the consequences of missing
  them, usually service credits.
- **Service-level objective (SLO)**: the target value for a measured service level, such as
  99.9 % monthly availability. In Google's site reliability engineering terms, an SLO is the
  target, and an SLA is the agreement that attaches consequences to meeting or missing it.
- **Memorandum of understanding (MOU)**: a statement of shared intent and cooperation, usually
  not legally binding.
- **Memorandum of agreement (MOA)**: a more formal document setting each party's
  responsibilities and conditions for working together, often between public bodies.
- **Non-disclosure agreement (NDA)**: protects confidential information that parties share,
  signed before due diligence reveals architecture or test reports.

An SLA clause states the indicator, the target, the measurement and the consequence:

```text
Schedule 2: Service Levels
2.1 Availability. The Service will be Available 99.9% of each calendar month, measured by the
    Provider's external probes every 60 seconds, excluding Scheduled Maintenance notified at
    least 5 business days ahead.
2.2 Service credits. Monthly availability 99.0% to <99.9%: 10% of the monthly fee;
    95.0% to <99.0%: 25%; below 95.0%: 50%.
2.3 Security incidents. The Provider will notify the Customer of any Security Incident affecting
    Customer Data without undue delay and in any event within 24 hours of becoming aware of it.
```

Percentages hide how little downtime they allow:

```python
minutes_in_month = 30 * 24 * 60          # a 30-day month
for target in (99.0, 99.5, 99.9, 99.95, 99.99):
    allowed = minutes_in_month * (100 - target) / 100
    print(f"{target:>6}% available -> {allowed:7.1f} minutes of downtime allowed")

outage_minutes = 38 + 61                 # two outages this month
measured = 100 * (minutes_in_month - outage_minutes) / minutes_in_month
print(f"measured availability: {measured:.3f}%")
```

```text
  99.0% available ->   432.0 minutes of downtime allowed
  99.5% available ->   216.0 minutes of downtime allowed
  99.9% available ->    43.2 minutes of downtime allowed
 99.95% available ->    21.6 minutes of downtime allowed
 99.99% available ->     4.3 minutes of downtime allowed
measured availability: 99.771%
```

Two outages of 38 and 61 minutes bring the month to 99.771 %, under 99.9 %, so clause 2.2 gives
a 10 % credit. Notice also what is missing: a credit does not pay for your lost sales.

## Vendor monitoring

Assurance continues after signing:

- **Vendor registry**: the inventory of every vendor, its services, the data it holds, its
  owner inside your organization and its **tier** (criticality), which sets how often it is
  reassessed.
- **Vendor assessment**: periodic reassessment by tier, through questionnaires, evidence
  reviews and, for the most critical, on-site visits.
- **Right to audit**: a contract clause allowing you, or an auditor you appoint, to examine the
  vendor's controls. Without it, you can only ask.
- **Service-level monitoring**: measure the service yourself where possible, and review the
  vendor's reports against the SLA.
- **Compliance attestation**: independent evidence such as a SOC 2 report from a CPA firm (Type 1
  covers control design at one date; Type 2 covers design and operating effectiveness over a
  period, usually 6 to 12 months), an ISO/IEC 27001 certificate, or a PCI DSS attestation of
  compliance.
- **Penetration testing**: the contract requires the vendor to test regularly and share
  summaries, or lets you test under agreed rules of engagement.

A registry makes overdue reviews visible. Tier 1 is reassessed yearly and must have a current
SOC 2 Type 2 report:

```bash
today=2026-10-16
tail -n +2 vendors.csv | while IFS=, read -r vendor service tier data assessed soc2; do
  case $tier in 1) months=12 ;; 2) months=24 ;; *) months=36 ;; esac
  due=$(date -d "$assessed +$months months" +%F)
  [[ $due < $today ]] && echo "$vendor (tier $tier): reassessment was due $due"
  if [[ $tier == 1 ]]; then
    if [[ -z $soc2 ]] || [[ $(date -d "$soc2 +12 months" +%F) < $today ]]; then
      echo "$vendor (tier $tier): no current SOC 2 Type 2 report (period ended ${soc2:-never})"
    fi
  fi
done
```

```text
Northwind Logistics (tier 2): reassessment was due 2026-08-30
Cirrus Mail (tier 1): reassessment was due 2026-07-01
Cirrus Mail (tier 1): no current SOC 2 Type 2 report (period ended 2025-03-31)
```

The email security gateway that sees all inbound mail is both overdue and without current
evidence: it goes to the top of the list.

## Limitations and constraints

- **Staffing limitations** and **resource availability**: a small team cannot deeply assess
  hundreds of vendors, which is why tiers exist.
- **Environment**: a multi-tenant SaaS or large cloud provider will not let each customer audit
  its data centers; shared responsibility decides who secures what.
- **Legal and regulatory factors**: data protection law restricts transfers and requires
  processor contracts; regulators may demand specific clauses.
- **Geography and jurisdiction**: where data and staff are decides which laws and governments
  can reach it.
- **Financial and return on investment (ROI)**: spend assurance effort where the tier justifies
  it, and beware the cheapest bid with the weakest security.
- **Vendor lock-in**: proprietary formats make leaving hard, so negotiate data export and an
  exit plan up front (GV.SC-10 covers the end of a relationship).
- **Assurance mechanisms**: you often rely on attestations, not your own tests. Read their scope,
  period and exceptions, and ask for a bridge letter covering the time since the period ended.

## Rules of engagement

When you assess or test a vendor (or a vendor tests you), write down the **rules of
engagement** first: written authorization from the system owner, the exact scope, permitted and
forbidden techniques, time windows, contacts on both sides, how findings and any data
encountered are handled, and how to stop testing immediately. The relationship itself also needs
rules: who talks to whom, how incidents are escalated, and within what time.

## Common mistakes

- Sending a questionnaire once and filing the answers unread.
- Accepting a SOC 2 Type 1 report, or one whose scope excludes the service you buy.
- Signing an SLA with credits but no security notification duty or right to audit.
- Forgetting the vendor's own suppliers (fourth parties).
- No exit plan: data cannot be retrieved when the contract ends.

## Practice

1. Which document: you know exactly the 400 laptops you want and need prices?
2. A provider promises 99.95 %. How many minutes of downtime does a 30-day month allow?
3. A tier 1 vendor sends a SOC 2 Type 2 report whose period ended 14 months ago. What do you
   ask for?

### Answers

1. A request for quote (RFQ).
2. 21.6 minutes.
3. The current report, or a bridge letter covering the time since the period ended, and confirm
   that the report's scope includes the service you use.

## Key takeaways

- Third parties extend your attack surface; tier them by criticality and data.
- RFI and EOI explore, RFP asks for solutions, RFQ asks for prices; diligence comes before signing.
- MSA sets terms, SOW the work, SLA the consequences, SLO the target; MOU and MOA record cooperation; NDA protects secrets.
- Monitor with a registry, reassessments, audits, attestations and testing within stated limits.

## Further reading

- [NIST SP 800-161 Rev. 1, Cybersecurity Supply Chain Risk Management Practices](https://csrc.nist.gov/pubs/sp/800/161/r1/upd1/final)
- [NIST Cybersecurity Framework 2.0 (CSWP 29)](https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.29.pdf)
- [Google SRE Book: Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)
