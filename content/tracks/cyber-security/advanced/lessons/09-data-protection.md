---
title: Data Protection
summary: Protect data by type, state and classification, choose among masking, hashing, filtering, tokenization, encryption, transposition, de-identification and obfuscation, and assign the data owner, custodian, steward, operator, controller and subprocessor roles (SY0-801 objective 3.3).
minutes: 35
objectives:
  - Distinguish structured from unstructured data and protect data at rest, in transit and in use
  - Apply government and commercial classification levels and the handling each one implies
  - Choose and apply masking, hashing, filtering, tokenization, encryption, transposition, de-identification and obfuscation
  - Assign data protection responsibilities to owners, custodians, stewards, operators, controllers and subprocessors
---

## Outline

1. Data types
2. Data states
3. Classification
4. Methods to secure data
5. Data protection roles

## Data types

**Structured data** has a fixed schema: rows and columns in a database, a CSV export, a spreadsheet of appointments. Because every value sits in a named field, you can find all the card numbers with one query and protect that column. **Unstructured data** has no schema: documents, email, chat, scanned letters, images, recordings. It is most of what organizations hold and the hardest to protect, because sensitive values hide in free text: a patient's diagnosis in an email, a password in a meeting note. Discovering and labeling it needs content inspection (DLP scanners) and user labeling. Formats such as JSON and log files sit in between and are sometimes called semi-structured.

## Data states

Data is protected differently in each **state**:

- **At rest**: stored on disks, databases, backups and phones. Controls: full-disk and database encryption, file permissions, access control, secure deletion.
- **In transit**: moving over a network. Controls: TLS, VPNs, SSH, encrypted email; never cleartext protocols.
- **In use**: loaded in memory and being processed, where it must be readable. This is the hardest state: controls include strict access control, masking on screen, process isolation, and **confidential computing**, where secure enclaves keep data encrypted in memory even from the host's administrators.

An attacker goes where protection is weakest. Encrypting the database at rest does nothing against an application account that reads every row in use.

## Classification

**Classification** assigns each data set a level that decides its handling. Governments use the levels of US Executive Order 13526, defined by the damage unauthorized disclosure "reasonably could be expected to cause" to national security: **Top Secret** (exceptionally grave damage), **Secret** (serious damage) and **Confidential** (damage). Companies use their own scheme, commonly something like:

```text
Level         Meaning                                        Example handling
Public        approved for anyone; no harm if disclosed      no restriction
Sensitive     internal; limited harm if disclosed            staff only, no public links
Confidential  significant harm to people or the business     need to know, encrypted, logged
Restricted    severe harm; often regulated                   named people, MFA, DLP blocks sharing
Critical      the business cannot run without it             backups, integrity checks, tested restore
```

The words differ between organizations; what matters is that every level has written handling rules and every data set has a level. **Critical** is about availability and integrity as much as confidentiality: a production recipe or a dispatch database may be harmless to disclose but disastrous to lose. Classify by the most sensitive element: a spreadsheet with one column of health data is Restricted, all of it.

## Methods to secure data

Each method below fits a different need. This script applies several to clinic records (the card numbers are standard test numbers):

```python
import hashlib
import hmac
import random
import secrets

PEPPER = b"kept-in-the-key-vault-not-in-code"  # secret key for keyed hashing
vault = {}  # token -> real value; in production a separate, locked-down service

def mask(card):
    return "*" * (len(card) - 4) + card[-4:]

def tokenize(card):
    token = "tok_" + secrets.token_hex(8)
    vault[token] = card
    return token

def pseudonym(name):
    return hmac.new(PEPPER, name.encode(), hashlib.sha256).hexdigest()[:12]

# for each record: mask the card; tokenize one card; build a de-identified row with
# pseudonym(name), the first half of the postcode and a 10-year age band;
# then shuffle the diagnosis column with random.Random(7)
```

```text
masked:    ************1111
masked:    ************5559
masked:    ***********0009
hash (plain sha256 of a card number): 9bbef19476623ca5 ...
tokenized: True 20 | detokenized: 4111111111111111
de-identified: {'id': '16bf4e2aa804', 'area': 'BS1', 'age_band': '30-39', 'diagnosis': 'asthma'}
de-identified: {'id': '6af445f43115', 'area': 'BS6', 'age_band': '50-59', 'diagnosis': 'diabetes'}
de-identified: {'id': 'b586c955de9c', 'area': 'BS3', 'age_band': '40-49', 'diagnosis': 'migraine'}
transposed diagnoses: ['migraine', 'asthma', 'diabetes']
```

- **Masking** hides part of a value when it is shown (`************1111`), so a call center agent can confirm a card without seeing it. The full value still exists underneath; **static** masking writes masked copies (for test databases), **dynamic** masking masks at display time per user.
- **Hashing** is one-way. It suits integrity checks and storing passwords, but a plain hash of a card number or national ID can be reversed by hashing every possible value, because there are few of them. A **keyed hash** (HMAC with a secret kept in a key vault, as in `pseudonym()`) gives stable pseudonyms that outsiders cannot recompute.
- **Filtering** removes what the recipient should not get: drop the diagnosis column from the marketing export, or let DLP strip card numbers from outgoing mail. The safest data is data you never share or never collect (data minimization).
- **Tokenization** replaces the value with a random **token** that has no mathematical link to it; only the vault maps it back. Systems that hold only tokens hold nothing worth stealing, which is how merchants shrink their PCI DSS scope.
- **Encryption** transforms data with a key and reverses with the key. It protects data at rest and in transit, and its strength is the key management: who can decrypt is who can read.
- **Data transposition** rearranges values so the original arrangement is hidden: swapping or shuffling a column between records, as the last line shows, keeps totals and distributions for statistics while breaking the link between a person and a value. (Transposition ciphers, which reorder characters, are the cryptographic form.)
- **De-identification** removes direct identifiers (names, card numbers) and generalizes **quasi-identifiers** (postcode to area, age to a band) that could be combined to single someone out. Under the GDPR, data that can still be re-linked with a separately kept key is **pseudonymized** and remains personal data; only data that can no longer be attributed to a person by any reasonable means is anonymous.
- **Obfuscation** is the umbrella term for making data or code hard to understand without making it impossible; masking, tokenization and code obfuscation are forms of it. On its own it is a speed bump, not a lock.

## Data protection roles

- The **data owner** is a senior business person accountable for a data set: they classify it, approve who may access it and accept its risks. The owner of payroll data is the finance director, not IT.
- The **data custodian** implements the owner's decisions technically: databases, backups, encryption, access groups. Usually IT or a system administrator.
- The **data steward** looks after the data's quality and proper use: definitions, metadata, labeling, and checking that use matches policy.
- The **data operator** is a person or system that handles the data day to day (entering, updating, processing records) under the rules the owner set. It is the exam's term rather than a legal one.
- The **data controller** (a GDPR term) "determines the purposes and means of the processing of personal data": the clinic deciding to keep patient records.
- A **data processor** processes personal data on the controller's behalf, such as the clinic's cloud booking provider. A **data subprocessor** is a processor engaged by that processor, such as the booking provider's email delivery service. GDPR Article 28 lets a processor engage one only with the controller's written authorization, under the same data protection obligations, and the first processor stays fully liable for it.

## Common mistakes

- Encrypting at rest and calling the data protected while application accounts can read all of it.
- Hashing national ID numbers without a key and calling the result anonymous.
- Classifying a mixed data set by its least sensitive part.
- Assuming IT owns the data. IT is the custodian; the business owns it.
- Signing a cloud contract without asking which subprocessors will touch the data.

## Practice

1. Which method lets a payment system keep a usable reference to a card while holding nothing that can be reversed without a separate system?
2. A researcher needs age and diagnosis statistics but no identities. Name two methods to apply before sharing.
3. Who classifies the HR database, and who configures its backups?
4. A clinic uses a booking SaaS, which uses a text message gateway to send reminders. Name the controller, processor and subprocessor.

### Answers

1. Tokenization.
2. De-identification (remove names, generalize ages and postcodes) and filtering (drop fields the study does not need); transposition can further break record links.
3. The data owner (the HR director) classifies it; the data custodian (IT) configures backups.
4. The clinic is the controller, the booking SaaS the processor, and the text message gateway the subprocessor.

## Key takeaways

- Structured data is easy to find and protect by column; unstructured data needs discovery and labels.
- Protect each state: encryption and access control at rest, TLS in transit, access control and enclaves in use.
- Classification levels (government and commercial) only work with handling rules for each.
- Mask for display, tokenize to remove value, encrypt with managed keys, use keyed hashes for pseudonyms, de-identify before sharing.
- Owners decide, custodians implement, stewards curate, operators handle; controllers, processors and subprocessors share legal duties.

## Further reading

- [GDPR Article 4: Definitions](https://gdpr-info.eu/art-4-gdpr/)
- [GDPR Article 28: Processor](https://gdpr-info.eu/art-28-gdpr/)
- [Executive Order 13526: Classified National Security Information](https://www.archives.gov/isoo/policy-documents/cnsi-eo.html)
- [NIST SP 800-188: De-Identifying Government Data Sets](https://csrc.nist.gov/pubs/sp/800/188/final)
