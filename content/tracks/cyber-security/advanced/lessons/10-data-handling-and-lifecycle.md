---
title: Data Handling and the Data Life Cycle
summary: Handle data safely on endpoints, mark and label it, control where it is stored and used with data location, placement and geofencing, manage it from creation to disposal with a retention schedule and legal holds, and recognize regulated data (health, personal, financial, children's, intellectual property, legal) (SY0-801 objective 3.3).
minutes: 35
objectives:
  - Apply endpoint handling rules, marking and labeling, geofencing, and data location and placement controls
  - Manage data through creation, management, distribution, retention and disposal, applying a retention schedule and legal holds
  - Recognize health, personal, financial, children's, intellectual property and legal data and the standards and laws that govern them
---

## Outline

1. Handling on endpoints
2. Marking and labeling
3. Location, placement and geofencing
4. The data life cycle
5. Retention and disposal in practice
6. Regulated data

## Handling on endpoints

Data that lives in a well-guarded database leaks from the laptops and phones that hold copies of it: a spreadsheet export, a synced folder, a photo of a whiteboard. **Endpoint** handling rules decide what may be stored on a device and how: full-disk encryption on every laptop, MDM with remote wipe on phones, DLP agents that block copying Restricted files to USB drives or personal cloud storage, no local sync of the most sensitive libraries, and screen privacy where others can see. The rule of thumb: the fewer copies, the fewer places to protect.

## Marking and labeling

**Marking** makes classification visible to people: "CONFIDENTIAL" in a header, footer or watermark, a label on a backup tape, a cover sheet on printed records. **Labeling** attaches the classification as metadata that systems can act on. A sensitivity label applied in Microsoft Purview, for example, is stored inside the document, travels with it, can add visual marking and encryption automatically, and tells DLP rules what to block. Labels can be applied by users, by default for a location, or automatically when content inspection finds card numbers or health terms. A label nobody acts on is decoration; wire each label to handling rules.

## Location, placement and geofencing

**Data location** is where the data physically sits: which data center, which country. It matters because of **data sovereignty**: data is subject to the laws of the place where it is stored, and some laws restrict moving personal data abroad (the GDPR's transfer rules) or require certain data to stay in-country. **Data placement** is the deliberate decision of which data goes in which system, region and storage tier: EU customer records in EU regions, backups of health records in the same jurisdiction, test environments with masked data only.

In the cloud, placement is enforced with policy rather than trust. This AWS policy, based on the example in AWS's IAM documentation, refuses any action in a region other than the two EU ones (global services such as IAM are exempted because their endpoints are in a US region):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyAllOutsideEU",
      "Effect": "Deny",
      "NotAction": ["cloudfront:*", "iam:*", "organizations:*", "route53:*", "support:*"],
      "Resource": "*",
      "Condition": {
        "StringNotEquals": {"aws:RequestedRegion": ["eu-central-1", "eu-west-1"]}
      }
    }
  ]
}
```

**Geofencing** uses a device's or request's location to allow or restrict actions: a conditional access rule that blocks sign-ins from countries where the company has no staff, an MDM policy that disables phone cameras inside a research lab, or a records application usable only from within the country. Location signals (IP address, GPS) can be spoofed, so geofencing is one input among several, not the only control.

## The data life cycle

Data moves through five stages, and each has its own controls:

1. **Creation** (or collection): collect only what the purpose needs, record why (the legal basis for personal data), and classify at birth, when the creator knows best what it is.
2. **Management**: store it in approved systems with access control, encryption, backups, integrity checks and an inventory of where it lives.
3. **Distribution**: share through approved, encrypted channels, with contracts (and data processing agreements) for third parties, and DLP watching the exits.
4. **Retention**: keep it as long as law and business need, and no longer. A **retention schedule** lists each record category with its period and trigger.
5. **Disposal**: destroy it in a way that cannot be undone, everywhere it exists, including backups and copies.

Old data is pure risk: it still costs money to store and protect, it can still be breached, and it serves no purpose. Retention without disposal is just hoarding.

## Retention and disposal in practice

A retention schedule turns into automation. This script applies a schedule to a records inventory on a fixed review date. A **legal hold**, issued when litigation or an investigation is expected, suspends disposal of the relevant records whatever the schedule says:

```text
category,retain,disposal
invoice,7y,secure delete with certificate
cctv,30d,automatic overwrite
job-application,1y,secure delete
patient-record,10y,purge and destroy media
```

```python
import csv
from datetime import date, timedelta

TODAY = date(2026, 10, 1)  # fixed review date


def retain_until(created, retain):
    amount, unit = int(retain[:-1]), retain[-1]
    if unit == "y":
        return created.replace(year=created.year + amount)
    return created + timedelta(days=amount)


schedule = {row["category"]: row for row in csv.DictReader(open("schedule.csv"))}
for rec in csv.DictReader(open("records.csv")):
    rule = schedule[rec["category"]]
    until = retain_until(date.fromisoformat(rec["created"]), rule["retain"])
    if rec["legal_hold"] == "yes":
        action = "HOLD: legal hold overrides the schedule"
    elif TODAY >= until:
        action = f"DISPOSE: {rule['disposal']}"
    else:
        action = "keep"
    print(f"{rec['record_id']:14} until {until}  {action}")
```

```text
INV-2018-0412  until 2025-03-14  DISPOSE: secure delete with certificate
INV-2019-1033  until 2026-11-02  keep
CCTV-0907      until 2026-10-07  keep
CCTV-0811      until 2026-09-10  HOLD: legal hold overrides the schedule
APP-2024-0050  until 2025-06-30  DISPOSE: secure delete
MED-2015-0007  until 2025-02-20  DISPOSE: purge and destroy media
```

The August camera footage is past its 30 days but under legal hold, perhaps because of an incident in the car park, so it must be kept; deleting it now could be spoliation of evidence. The 2018 invoice, the old job application and the expired patient record are due for disposal.

Disposal must match the media and the sensitivity. NIST SP 800-88 Rev. 2 (September 2025) describes sanitization techniques including **clearing** (overwriting through normal interfaces), **purging** (techniques that defeat laboratory recovery, including **cryptographic erase**, which destroys the key of an encrypted drive) and **destruction** (shredding, disintegration, incineration). Keep a **certificate of destruction** from whoever does it, and remember the copies: backups, replicas, exports on laptops.

## Regulated data

Some data carries legal duties of its own. Know the categories and the main rules:

- **Health data**: in the US, protected health information (PHI) under HIPAA; in the EU, health data is a special category under GDPR Article 9 with stricter conditions.
- **Personal information**: anything relating to an identifiable person (personally identifiable information, PII). The GDPR in Europe and state laws such as the California Consumer Privacy Act set rights and duties.
- **Financial data**: payment card data under the industry standard **PCI DSS** (version 4.0.1 is current), customer financial information under the US Gramm-Leach-Bliley Act (GLBA), and the integrity of financial reporting under Sarbanes-Oxley (SOX).
- **Children's data**: the US Children's Online Privacy Protection Act (COPPA) applies to online services directed to children under 13 and requires verifiable parental consent; the GDPR sets a consent age between 13 and 16 depending on the country.
- **Intellectual property**: trade secrets, source code, designs and formulas. No law makes you protect them, but losing them can destroy the business, and trade secret protection depends on having taken reasonable steps to keep them secret.
- **Legal data**: contracts, case files and privileged communications with lawyers, often subject to legal holds and e-discovery.

**Standards** such as ISO/IEC 27001 and PCI DSS turn these duties into auditable controls. Regulation also drives the life cycle: retention periods come from laws, and so do breach notification deadlines.

## Common mistakes

- Labels applied but no DLP or encryption rule acting on them.
- Choosing a cloud region by price alone and discovering a data residency requirement later.
- Retention schedules that say how long to keep data but no process that ever deletes it.
- Disposing of data covered by a legal hold.
- Wiping the production database and forgetting the backups and analyst exports.

## Practice

1. A Restricted spreadsheet must never leave managed devices. Name two endpoint controls and one labeling control that enforce it.
2. Using the script's rules, what happens to `CCTV-0907` on 2026-10-08 if no hold is issued?
3. A self-encrypting drive with patient data is being returned to a leasing company. Which sanitization technique is fast and effective, and what proof do you keep?
4. Which law or standard applies: (a) a game for eight-year-olds collecting email addresses in the US; (b) a web shop storing card numbers; (c) a clinic's patient files in Germany?

### Answers

1. Full-disk encryption and a DLP agent blocking USB and personal cloud uploads; a sensitivity label that applies encryption and blocks sharing outside the organization.
2. It is past its retention date (2026-10-07), so the next run disposes of it by automatic overwrite.
3. Cryptographic erase (a purge technique), then a certificate recording the drive's serial number, the method and the date.
4. (a) COPPA; (b) PCI DSS; (c) GDPR, with health data as a special category.

## Key takeaways

- Endpoints hold copies: encrypt, manage and restrict them.
- Marking informs people; labels drive systems. Both need handling rules behind them.
- Location and placement decide which laws apply; enforce them with policy and use geofencing as one signal.
- Create, manage, distribute, retain, dispose: every stage has controls, and legal holds override disposal.
- Regulated data (health, personal, financial, children's, IP, legal) brings its own rules and standards.

## Further reading

- [NIST SP 800-88 Rev. 2: Guidelines for Media Sanitization](https://csrc.nist.gov/pubs/sp/800/88/r2/final)
- [AWS IAM: Deny access based on the requested Region](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_examples_aws_deny-requested-region.html)
- [FTC: Children's Online Privacy Protection Rule](https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa)
- [GDPR Article 9: Special categories of personal data](https://gdpr-info.eu/art-9-gdpr/)
