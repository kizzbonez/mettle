---
title: Security Awareness
summary: Build a security awareness program that changes behavior (SY0-801 objective 5.6). Choose onboarding, ongoing, targeted and corrective training, deliver it through an LMS, portals and one-to-one or one-to-many sessions, cover social engineering, BEC, credentials, remote work, BYOD, removable media, situational awareness and OPSEC, and measure effectiveness with metrics, managerial reports and behavior risk scoring.
minutes: 35
objectives:
  - Choose initial, ongoing, targeted and corrective training for a situation
  - Select delivery mechanisms (LMS, self-service portals, one-to-one, one-to-many) for an audience
  - Teach the common topics, including BEC, removable media and cables, situational awareness and OPSEC
  - Measure effectiveness with metrics, managerial reports and personnel behavior risk scoring, used fairly
---

## Outline

1. Awareness as a control
2. Types of training
3. Delivery mechanisms
4. Common training topics
5. Measuring effectiveness
6. Behavior risk scoring

This lesson covers SY0-801 objective 5.6.

## Awareness as a control

Attackers aim at people because people approve payments, open attachments and reset
passwords. The FBI's Internet Crime Complaint Center (IC3) received reports of $20.9 billion in
losses in 2025, of which business email compromise (BEC) accounted for about $3.05 billion from
24,768 complaints. NIST SP 800-50 Rev. 1, *Building a Cybersecurity and Privacy Learning
Program* (September 2024), treats awareness, training and education as a managed program with a
life cycle whose goal is changed behavior and a security culture, measured and improved over
time. **Awareness** draws attention to risks; **training** builds the skills a role needs.

## Types of training

- **Initial (onboarding)**: before or as access is granted. The acceptable use policy and its
  acknowledgement, how to report, passwords and MFA, and the handling of the data the role uses.
- **Ongoing**: regular refreshers (an annual course plus short monthly modules), phishing
  simulations and news about current threats, because knowledge fades and threats change.
- **Targeted**: for roles or groups with higher exposure. Finance staff learn payment verification
  against BEC, help desk staff identity checks before resets, developers secure coding,
  administrators privileged access, and executives deepfake and whaling attacks.
- **Corrective**: after a mistake, such as submitting credentials in a simulation or breaking a
  policy. It should be short, prompt and supportive; punishing people teaches them to hide
  mistakes instead of reporting them.

## Delivery mechanisms

- A **learning management system (LMS)** assigns courses, delivers them, records completion and
  scores, and sends reminders; linked to HR, it enrolls new starters automatically.
- **Self-service portals** let staff find what they need when they need it: how to report a
  phish, the policies, short guides.
- **One-to-one** sessions coach an individual, such as a repeat clicker or an executive with a
  heavy public profile.
- **One-to-many** sessions reach everyone at once: webinars, all-hands briefings, videos and
  posters.

## Common training topics

- **Social engineering**: phishing, spear phishing, smishing (SMS), vishing (voice), QR-code
  phishing, pretexting and impersonation of IT or executives.
- **Emerging security topics**: AI-written phishing without the old spelling mistakes, cloned
  voices and video in payment requests, MFA fatigue prompts.
- **Password and credential management**: password managers, passkeys, never sharing
  credentials, and never approving an MFA prompt you did not start.
- **Remote work, teleworking and hybrid**: home networks, public Wi-Fi and the VPN, screen
  privacy in public, family members and work devices, printing at home.
- **BYOD**: enrollment, updates, separation of work data, reporting a lost phone at once.
- **Business email compromise (BEC)**: criminals use a compromised or look-alike mailbox of a
  supplier or executive to redirect a payment. The defense is a process: verify any change of
  bank details by calling a number already on file, never one in the email.
- **Removable media and cables**: unknown USB drives can carry malware, and a charging cable can
  contain hidden electronics that act as a keyboard or a network device. Use issued media and
  your own chargers, and hand found devices to security.
- **Situational awareness**: noticing tailgaters, shoulder surfers, unbadged visitors and
  unusual requests, at the office and in public.
- **Operational security (OPSEC)**: not revealing what helps an attacker, such as badges in
  photos, internal system names on social media, travel plans or who approves payments.

A BEC message to use in training, with its tells:

```text
From: "Maria Lopez (Ridgeway Components)" <m.lopez@ridgeway-cornponents.com>
Reply-To: <ridgeway.accounts@outlook.com>
To: payables@example.com
Subject: RE: Invoice 47120 updated remittance details

Hi Sam, as discussed with your CFO, our bank has changed after an audit. Please use the
new account below for invoice 47120 (USD 186,400) and any future payments. Kindly process
today as our old account is now closed. I am in meetings, so email only please.
```

The domain spells "components" with "rn", the reply goes to a free mailbox, it changes bank
details, claims authority, adds urgency and avoids a phone call. Each tell is a teaching point;
the control is the call-back to the number already on file.

## Measuring effectiveness

Completion rates show that training happened, not that it worked. Useful **metrics** measure
behavior: the share of staff who click a simulated phish, who submit credentials, who **report**
it, and how fast. A rising report rate and a short time to the first report are the best signs,
because one early report lets the SOC remove a real campaign from every mailbox. Results of a
twelve-person simulation:

```python
import pandas as pd

pd.set_option("display.width", 100)
df = pd.read_csv("campaign.csv")
for col in ["opened", "clicked", "submitted", "reported"]:
    df[col] = df[col].eq("yes")

report = df.groupby("department").agg(
    sent=("user", "size"),
    clicked=("clicked", "mean"),
    submitted=("submitted", "mean"),
    reported=("reported", "mean"),
    report_minutes=("minutes_to_report", "median"),
)
print(report.round(2))
print("overall: clicked", round(df["clicked"].mean(), 2), "reported", round(df["reported"].mean(), 2))
```

```text
             sent  clicked  submitted  reported  report_minutes
department                                                     
Engineering     4     0.25       0.00      0.75             4.0
Finance         4     0.50       0.25      0.50             8.5
Operations      4     0.25       0.00      0.50             4.0
overall: clicked 0.33 reported 0.58
```

Finance clicked most, was the only
department to submit credentials, and reported slowest, which argues for targeted training on
payment fraud there. Four people per department is far too small a sample for conclusions about
a real organization; look at trends over several campaigns.

**Managerial reports** turn the numbers into decisions for managers: their team's completion,
simulation trends, overdue training and the actions requested of them, compared over time
rather than as a public ranking of individuals.

## Behavior risk scoring

**Personnel behavior risk scoring** combines signals into a score per person so that training and
controls can be targeted where they matter. A scoring model, configured by the security team
with HR and legal:

```yaml
behavior_risk_score:          # 0 (low) to 100 (high); reviewed quarterly
  signals:
    simulation_submitted_credentials_90d: 30
    simulation_clicked_90d: 10
    reported_simulation_90d: -15
    training_overdue: 15
    privileged_access: 20        # exposure, not misbehavior
    handles_payments: 15
    dlp_policy_violations_90d: 10 per event, max 30
  use:
    - assign targeted or one-to-one training above 50
    - require phishing-resistant MFA above 70
  safeguards:
    - staff are told the score exists and what feeds it
    - managers see team aggregates; individual scores go to security and HR only
    - never the sole basis for discipline
```

Scores raise privacy and fairness questions, so they must be transparent, proportionate and
used to help people, with HR and legal involved from the start.

## Common mistakes

- Measuring only course completion.
- Shaming people who click, so nobody reports their mistakes.
- Simulations so obvious, or so cruel (a fake bonus), that they teach nothing or destroy trust.
- One generic annual course for everyone, with nothing targeted for finance or administrators.
- Making reporting hard: no button, no thanks, no feedback.

## Practice

1. A payables clerk submitted credentials in a simulation. Which training type, and how?
2. Which delivery mechanism tracks completion and enrolls new starters?
3. Which metric best shows that awareness is working: completion, click rate or report rate?
4. An engineer posts a photo from the data center with rack labels visible. Which topic?

### Answers

1. Corrective training: short, prompt and supportive, plus targeted BEC and payment
   verification training for the role.
2. The learning management system (LMS).
3. Report rate (and time to report): it measures the behavior that protects the organization.
4. Operational security (OPSEC).

## Key takeaways

- Training types: onboarding, ongoing, targeted for high-exposure roles, corrective after mistakes.
- Deliver by LMS, portals, one-to-one and one-to-many; teach BEC, media, OPSEC and more.
- Measure behavior (reporting, submissions), not only completion; report trends to managers.
- Behavior risk scores target help and must be transparent and fair.

## Further reading

- [NIST SP 800-50 Rev. 1, Building a Cybersecurity and Privacy Learning Program](https://csrc.nist.gov/pubs/sp/800/50/r1/final)
- [FBI IC3 2025 Internet Crime Report](https://www.ic3.gov/AnnualReport/Reports/2025_IC3Report.pdf)
- [CISA: Teach Employees to Avoid Phishing](https://www.cisa.gov/secure-our-world/teach-employees-avoid-phishing)
