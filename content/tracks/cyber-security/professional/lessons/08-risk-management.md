---
title: Risk Management
summary: Identify, assess, analyze and treat security risk (SY0-801 objective 5.2). Score risks qualitatively and quantitatively, compute single loss expectancy, annualized rate of occurrence and annualized loss expectancy with worked numbers, keep and review a risk register, choose to mitigate, transfer, accept or avoid, and connect it all to business impact analysis, risk appetite and residual risk.
minutes: 40
objectives:
  - Identify risks from assets, threats and vulnerabilities and give each one an owner
  - Score risks qualitatively with likelihood and impact, and quantitatively with SLE, ARO and ALE
  - Maintain a risk register that communicates risk and is reviewed on a schedule
  - Choose a treatment (mitigate, transfer, accept, avoid) in light of the BIA, risk appetite and residual risk
---

## Outline

1. Risk vocabulary
2. Identification
3. Assessment and qualitative analysis
4. Quantitative analysis: SLE, ARO and ALE
5. The risk register
6. Treatment
7. Business-level considerations

This lesson covers SY0-801 objective 5.2.

## Risk vocabulary

A **risk** is the possibility that a **threat** exploits a **vulnerability** in an **asset** and
causes harm. It is measured by two things: **likelihood** (how probable it is) and **impact** (how
bad it would be). **Inherent risk** is the risk before controls; **residual risk** is what is left
after them. Every risk has an **owner**, a business person with the authority to decide how it
is treated. NIST SP 800-30 Rev. 1 describes how to assess risk, and NIST IR 8286 Rev. 1 (December
2025) how cybersecurity risk registers feed the enterprise's overall risk management.

## Identification

Start from **asset identification**: the inventory and the business impact analysis say which
systems, data and processes matter. Then ask what threats could affect each one and through
which vulnerabilities, using scan results, audits, past incidents, threat intelligence and
workshops with the people who run the process. **Stakeholder ownership** is part of
identification: a risk written down without an owner will never be treated.

## Assessment and qualitative analysis

**Scoring** gives each risk a likelihood and an impact, often on scales of 1 to 5, and
**categorization** groups risks (operational, financial, compliance, reputational, or by
confidentiality, integrity and availability) so patterns show. **Analysis** records the impact,
the likelihood, the owner and the **current mitigations** already reducing it.

**Qualitative** analysis uses ordered words or numbers rather than money. A five-by-five matrix
multiplies likelihood by impact into bands:

```text
Impact ->        1 Minimal  2 Minor  3 Moderate  4 Major  5 Severe
Likelihood
5 Almost certain    5 M       10 H      15 H       20 C     25 C
4 Likely            4 L        8 M      12 H       16 C     20 C
3 Possible          3 L        6 M       9 M       12 H     15 H
2 Unlikely          2 L        4 L       6 M        8 M     10 H
1 Rare              1 L        2 L       3 L        4 L      5 M
Bands: L 1-4  M 5-9  H 10-15  C 16-25
```

It is quick and works without data, but it is subjective: two assessors may score the same risk
differently, and a "12" cannot be compared with a control's cost.

## Quantitative analysis: SLE, ARO and ALE

**Quantitative** analysis puts money on risk:

- **Asset value (AV)**: what the asset is worth, including the revenue and recovery costs tied
  to it.
- **Exposure factor (EF)**: the fraction of that value one occurrence destroys, from 0 to 1.
- **Single loss expectancy (SLE) = AV × EF**: the cost of one occurrence.
- **Annualized rate of occurrence (ARO)**: how many times a year it is expected. Twelve a year
  is 12; once every four years is 0.25.
- **Annualized loss expectancy (ALE) = SLE × ARO**: the expected loss per year.

Worked numbers: an order system valued at $900,000 loses 40 % of its value in a ransomware
attack (EF 0.40), so SLE = $360,000; with one attack expected every four years (ARO 0.25),
ALE = $90,000. Immutable backups and EDR cost $30,000 a year and are expected to cut EF to 0.10
(faster restore) and ARO to 0.10:

```python
def sle(asset_value, exposure_factor):
    return asset_value * exposure_factor


def ale(single_loss, aro):
    return single_loss * aro


risks = [
    # name, asset value (USD), exposure factor, annualized rate of occurrence
    ("Laptop lost or stolen", 1_800, 1.00, 12),
    ("Ransomware on order system", 900_000, 0.40, 0.25),
    ("Order system, after the control", 900_000, 0.10, 0.10),
]
for name, value, ef, aro in risks:
    s = sle(value, ef)
    print(f"{name:32} SLE ${s:>9,.0f}  ARO {aro:>5}  ALE ${ale(s, aro):>8,.0f}")

before = ale(sle(900_000, 0.40), 0.25)
after = ale(sle(900_000, 0.10), 0.10)
control_cost = 30_000
print(f"Value of the control per year: ${before - after - control_cost:,.0f}")
```

```text
Laptop lost or stolen            SLE $    1,800  ARO    12  ALE $  21,600
Ransomware on order system       SLE $  360,000  ARO  0.25  ALE $  90,000
Order system, after the control  SLE $   90,000  ARO   0.1  ALE $   9,000
Value of the control per year: $51,000
```

The control is worth buying because ALE before (90,000) minus ALE after (9,000) minus its annual
cost (30,000) is positive. The laptop risk shows why frequency matters: a cheap loss twelve
times a year costs more per year than many rare events. Quantitative results are only as good as
their inputs, so record where each AV, EF and ARO came from (incident history, insurance data,
industry reports) and how confident you are.

## The risk register

The **risk register** is the record of every identified risk and its treatment, and the main
tool for **communication**: it tells management what the risks are, who owns them and what is
being done. It is **reviewed** on a schedule (quarterly is common) and whenever something
changes: a new system, an incident, a new regulation.

```text
ID   Risk                                 Owner        L  I  Score  Current controls          Treatment  Residual  Review
R-07 Ransomware stops order processing    COO          3  5  15 H   EDR, daily backups        Mitigate   6 M       2027-01
R-12 Payroll SaaS breach exposes PII      HR Director  2  4   8 M   SOC 2 report, SSO + MFA   Transfer   4 L       2027-01
R-15 Legacy FTP server compromised        CIO          4  3  12 H   none                      Avoid      0         2026-12
R-21 Lost laptops (encrypted)             CFO          4  1   4 L   full-disk encryption, MDM Accept     4 L       2027-04
```

## Treatment

- **Mitigate**: add or strengthen controls to reduce likelihood or impact (R-07).
- **Transfer**: shift the financial impact to another party through insurance or a contract
  (R-12). Accountability stays with the organization: customers still blame you.
- **Accept**: knowingly live with a risk that is within appetite, documented and signed by its
  owner, with a review date (R-21). A temporary **exception** to a policy is a form of acceptance.
- **Avoid**: stop the activity that creates the risk, such as retiring the FTP service (R-15).

Ignoring a risk is not acceptance; acceptance is a recorded decision by someone with authority.

## Business-level considerations

- **Business impact analysis (BIA)** finds the critical business functions, how their impact
  grows over time when disrupted, their dependencies, and the recovery targets (maximum tolerable
  downtime, RTO, RPO) that drive continuity plans and impact scores.
- **Risk appetite** is the amount and type of risk the organization is willing to take to meet
  its objectives, set by its leadership; **risk tolerance** is the measurable limit around it. CSF
  2.0 asks that both statements be "established, communicated, and maintained" (GV.RM-02):

```text
Risk appetite statement (approved by the Board, 2026-03-12)
The company accepts moderate risk to launch new digital services quickly. It has a low appetite
for risks to customer personal data and to safety at its sites.
Tolerances: no risk scoring 16 or more may be accepted; any risk with an ALE above $250,000
requires Board approval to accept; critical systems must meet an RTO of 4 hours.
```

- **Residual risk** must fall within appetite; if it does not, more treatment is needed or a
  higher authority must accept it.
- **Stakeholder involvement** and **management oversight**: owners, the risk committee and the
  board review the register and decide; security advises, it does not decide alone.
- **Regulatory** and **legal** factors can make a risk unacceptable whatever its score: laws
  require certain controls, and contracts or liability raise the impact.

## Common mistakes

- Treating a CVSS score as the risk score, without asset value or likelihood.
- Mixing up the formulas: SLE uses the exposure factor, ALE uses the rate of occurrence.
- Calling an ignored risk "accepted" with no owner's signature.
- Believing insurance transfers accountability or reputational damage.
- Building the register once for an audit and never reviewing it.

## Practice

1. A warehouse worth $2,000,000 floods about once every 20 years and each flood destroys 25 %
   of its value. Compute SLE and ALE.
2. Flood barriers cost $10,000 a year and would cut EF to 5 %. Are they worth it?
3. Name the treatment: buying cyber insurance; disabling an unused partner VPN; accepting a
   low risk with a signed form; adding MFA.

### Answers

1. SLE = $2,000,000 × 0.25 = $500,000; ARO = 1/20 = 0.05; ALE = $25,000.
2. New SLE = $100,000, ALE = $5,000. Value = 25,000 − 5,000 − 10,000 = $10,000 a year: yes.
3. Transfer; avoid; accept; mitigate.

## Key takeaways

- Risk combines likelihood and impact; every risk needs an owner.
- Qualitative scoring is fast and subjective; quantitative uses SLE = AV × EF and ALE = SLE × ARO.
- A control is worth it when ALE before − ALE after − its annual cost is positive.
- Keep a reviewed register; treat by mitigating, transferring, accepting or avoiding within appetite.

## Further reading

- [NIST SP 800-30 Rev. 1, Guide for Conducting Risk Assessments](https://csrc.nist.gov/pubs/sp/800/30/r1/final)
- [NIST IR 8286 Rev. 1, Integrating Cybersecurity and Enterprise Risk Management](https://csrc.nist.gov/pubs/ir/8286/r1/final)
- [NIST Cybersecurity Framework 2.0 (CSWP 29)](https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.29.pdf)
