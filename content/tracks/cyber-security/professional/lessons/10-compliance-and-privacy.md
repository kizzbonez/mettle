---
title: Compliance and Privacy
summary: Make security compliance effective (SY0-801 objective 5.4). Train staff on data handling, anti-money laundering and anti-bribery, monitor compliance with attestations and acknowledgements, understand the consequences of failure, honor privacy rights (erasure, consent, correction, restriction and objection) as controller or processor, and handle legal holds, legal orders and retention requirements.
minutes: 35
objectives:
  - Describe compliance training topics and how attestations and acknowledgements show compliance
  - Explain the reputational, financial, legal, contractual, sanction and licensing consequences of non-compliance
  - Handle privacy rights requests within their deadlines and distinguish controller, processor and data owner
  - Apply legal holds, respond to legal orders and enforce retention requirements
---

## Outline

1. What compliance means
2. Compliance training
3. Compliance monitoring
4. Consequences of non-compliance
5. Privacy rights
6. Controllers, processors and ownership
7. Legal holds, legal orders and retention

This lesson covers SY0-801 objective 5.4.

## What compliance means

**Compliance** is meeting obligations and being able to prove it. Obligations come from laws and
regulations (data protection, financial, health, sector rules), from contracts (the Payment Card
Industry Data Security Standard, PCI DSS, is imposed through card brands and the banks that
process payments), from standards the organization has adopted, and from its own policies.
Security supplies many of the controls; compliance adds the evidence.

## Compliance training

- **Data handling**: how each classification is stored, shared, transmitted and disposed of,
  where personal data may and may not go, and how to report a mistake.
- **Anti-money laundering and counter-terrorism financing (AML/CTF)**: required in banks,
  payment firms and other regulated sectors. Staff learn to verify customers (know your
  customer), recognize suspicious transactions, report them to the designated officer, and never
  warn the customer ("tipping off").
- **Anti-bribery**: rules on gifts, hospitality and payments to officials, and on intermediaries
  who might pay bribes on the company's behalf. The US Foreign Corrupt Practices Act and the UK
  Bribery Act 2010 apply far beyond their borders, and the UK Act makes failing to prevent
  bribery an offence unless the company had adequate procedures, of which training is one.

Completion is recorded per person and course, because the record is the evidence.

## Compliance monitoring

An **attestation** is a formal statement that something is true, made by someone accountable:
a manager attesting each quarter that the access of their team is correct, a chief executive
attesting to a regulator, or an independent auditor's report such as a SOC 2 or a PCI DSS
attestation of compliance. An **acknowledgement** is an individual's recorded confirmation that
they received, read and accept a policy, kept with its version and date:

```text
ACKNOWLEDGEMENT RECORD
Employee:   m.chen (Finance)            Policy:  POL-004 Acceptable Use Policy v3.1
Presented:  2026-10-02 via LMS          Accepted: 2026-10-02 09:41 UTC (checkbox + SSO identity)
Attestation (manager, Q3 access review): "I confirm the 14 access rights listed for my team are
required for their roles."  Signed: S. Patel, 2026-10-05
```

Continuous compliance tools and internal audit then check that controls really operate.

## Consequences of non-compliance

- **Reputational damage**: customers and partners lose trust, often costing more than any fine.
- **Financial**: fines and penalties. Under the EU General Data Protection Regulation (GDPR),
  serious infringements can cost up to €20 million or 4 % of total worldwide annual turnover,
  whichever is higher (Art. 83(5)).
- **Legal**: lawsuits, regulator orders and, in some regimes, personal liability for executives.
- **Contractual**: breach of contract, lost customers, and for PCI DSS, fees or the loss of the
  ability to accept card payments.
- **Sanctions**: regulators restrict what the organization may do, and violating economic
  sanctions (for example by paying a sanctioned ransomware group) brings its own penalties.
- **Loss of license**: banks, insurers, healthcare providers and payment institutions operate
  under licenses that a regulator can suspend or withdraw.

## Privacy rights

GDPR gives people (**data subjects**) rights the organization must honor:

- **Right to be forgotten** (erasure, Art. 17): delete personal data without undue delay when,
  for example, it is no longer needed or consent is withdrawn. Exceptions include data the
  organization must keep by law and data needed for legal claims.
- **Opt-in or opt-out**: GDPR consent must be opt-in, a clear affirmative action, never a
  pre-ticked box, and as easy to withdraw as to give. Some other laws use opt-out models, such as
  unsubscribe links under the US CAN-SPAM Act or California's right to opt out of the sale or
  sharing of personal information.
- **Data correction** (rectification, Art. 16): fix inaccurate personal data.
- **Processing restrictions** (Art. 18): keep the data but stop using it, for example while its
  accuracy is disputed or the person needs it kept for a legal claim.
- **Processing prevention** (the right to object, Art. 21): stop processing based on legitimate
  interests unless there are compelling grounds, and always stop processing for direct marketing.

Requests must be answered "without undue delay and in any event within one month of receipt"
(Art. 12(3)), extendable by two further months for complex cases if the person is told within
the first month. A tracker that checks the deadline:

```bash
today=2026-10-16
jq -r 'select(.status == "open") | [.id, .type, .received] | @tsv' requests.jsonl |
while IFS=$'\t' read -r id type received; do
  due=$(date -d "$received +1 month" +%F)
  left=$(( ($(date -d "$due" +%s) - $(date -d "$today" +%s)) / 86400 ))
  if (( left < 0 )); then state="OVERDUE by $(( -left )) days"; else state="$left days left"; fi
  printf '%s %-13s received %s due %s %s\n' "$id" "$type" "$received" "$due" "$state"
done
```

```text
DSR-2026-0187 erasure       received 2026-09-10 due 2026-10-10 OVERDUE by 6 days
DSR-2026-0191 rectification received 2026-09-24 due 2026-10-24 8 days left
DSR-2026-0204 restriction   received 2026-10-12 due 2026-11-12 27 days left
```

## Controllers, processors and ownership

The **controller** "determines the purposes and means of the processing" (Art. 4(7)): the
company that decides to run a loyalty program. The **processor** "processes personal data on
behalf of the controller" (Art. 4(8)): the email platform that sends the loyalty emails. A
processor acts only on documented instructions under a contract (Art. 28), and the controller
stays accountable for choosing it. Inside the organization, the **data owner** is the senior
business role accountable for a data set's classification and use. Contracts must also say
who owns data held by a vendor and how it is returned or deleted at the end.

## Legal holds, legal orders and retention

A **legal hold** suspends normal deletion for everything relevant to actual or expected
litigation or investigation, overriding the retention schedule until legal counsel releases it:

```text
LEGAL HOLD NOTICE  HOLD-2026-03                    Issued by: Legal, 2026-03-18
Matter: Dispute with Westbay Supplies Ltd over invoices 2019-2021
You must preserve, and must not delete or alter, all documents, email, chat messages and files
relating to Westbay Supplies from 2019-01-01 onward, in any location, including personal drives.
IT: suspend automated deletion for the listed mailboxes and the finance archive.
This notice remains in force until Legal releases it in writing. Confirm receipt by 2026-03-25.
```

**Legal orders** (subpoenas, court orders, search warrants, regulator demands) go to the legal
team, which checks that the order is genuine and valid, discloses exactly what it requires, and
records what was provided. Staff never answer them on their own.

**Data retention requirements** work in both directions: laws set minimum periods (tax and
accounting records, for example), and GDPR's storage limitation principle (Art. 5(1)(e)) sets a
maximum, as long as necessary for the purpose. Disposal must respect holds:

```bash
today=2026-10-16
tail -n +2 records.csv | while IFS=, read -r rec cat created months hold; do
  expires=$(date -d "$created +$months months" +%F)
  [[ $expires > $today ]] && continue
  if [[ -n $hold ]]; then echo "KEEP     $rec ($cat) expired $expires but is under $hold"
  else echo "DISPOSE  $rec ($cat) expired $expires"; fi
done
```

```text
DISPOSE  INV-2018-0442 (supplier invoice) expired 2025-03-02
KEEP     INV-2019-0107 (supplier invoice) expired 2026-01-15 but is under HOLD-2026-03
DISPOSE  CV-2023-0981 (job applicant CV) expired 2024-05-20
```

## Common mistakes

- Pre-ticked consent boxes, or burying the withdrawal of consent.
- Deleting data under a legal hold because the retention schedule said so.
- Keeping personal data "just in case" beyond its retention period.
- An engineer answering a subpoena or police email directly.
- Assuming a processor carries the compliance risk for the controller.

## Practice

1. A customer asks for erasure, but their invoices must be kept for seven years by tax law. What
   do you do?
2. Which role is a cloud payroll provider that runs payroll on your instructions?
3. Name the evidence: an employee's dated confirmation that they read the BYOD policy.

### Answers

1. Erase what is no longer needed, keep the invoices under the legal-obligation exception
   (Art. 17(3)), restrict their use to that purpose, and explain this to the customer within
   one month.
2. A processor; your organization is the controller.
3. An acknowledgement.

## Key takeaways

- Compliance means meeting obligations and proving it with training records, attestations and acknowledgements.
- Failure costs reputation, money, lawsuits, contracts, sanctions and even the license to operate.
- Honor erasure, consent, correction, restriction and objection within one month.
- Controllers decide, processors act for them; legal holds override retention, and legal orders go to legal.

## Further reading

- [GDPR Art. 17: Right to erasure](https://gdpr-info.eu/art-17-gdpr/)
- [GDPR Art. 12: Transparent information and time limits](https://gdpr-info.eu/art-12-gdpr/)
- [GDPR Art. 4: Definitions](https://gdpr-info.eu/art-4-gdpr/)
