---
title: Social Engineering and Physical Attacks
summary: Phishing and its targeted forms (spear phishing, whaling, smishing, vishing, quishing), impersonation, deepfakes and business email compromise, read from real message headers, and the physical attacks that bypass technology, tailgating, shoulder surfing, skimming and forced entry, with the indicators and controls for each (SY0-801 objective 2.5).
minutes: 30
objectives:
  - Distinguish phishing, spear phishing, whaling, smishing, vishing and quishing
  - Analyze email headers for display-name tricks, Reply-To changes, lookalike domains and authentication failures
  - Explain business email compromise and deepfake fraud, and the payment controls that stop them
  - Recognize tailgating, shoulder surfing, skimming and forced entry from physical security logs
---

## Outline

1. Why social engineering works
2. The phishing family
3. Impersonation, deepfakes and business email compromise
4. Reading a suspicious message
5. Physical attacks
6. Controls that work

## Why social engineering works

**Social engineering** manipulates people into doing something that helps the attacker: clicking,
paying, telling, or holding a door. It works on a few levers: **authority** (the CEO asks),
**urgency** (before 3 p.m.), **scarcity** and **fear** (your account will close), **familiarity**
(a known supplier) and **helpfulness**. Lesson 4 covered the channels; this lesson covers the
attacks themselves and what they leave behind.

## The phishing family

- **Phishing**: fraudulent messages sent widely to steal credentials, money or access, or to
  deliver malware.
- **Spear phishing**: aimed at a particular person or team, using details from social media, the
  company website or earlier breaches to be believable.
- **Whaling**: spear phishing aimed at senior executives, who can approve payments and whose
  accounts open everything.
- **Smishing**: phishing by SMS (and RCS): parcel fees, bank alerts, road tolls.
- **Vishing**: voice phishing by phone, including calls to help desks to reset passwords or MFA
  (ATT&CK T1566.004, Spearphishing Voice).
- **Quishing**: phishing with a QR code, which hides the link from filters and moves the victim to
  a personal phone.

## Impersonation, deepfakes and business email compromise

**Impersonation** is pretending to be someone the victim trusts: IT support, a courier, an
auditor, a supplier, a manager. The invented story that makes it believable is the **pretext**.

A **deepfake** is synthetic audio or video of a real person. In early 2024 Hong Kong police
reported that a finance employee had joined a video call with what looked and sounded like the
company's chief financial officer and colleagues, all generated, and made 15 transfers totaling
HK$200 million; the engineering firm Arup later confirmed it was the victim. A familiar face on a
screen is no longer proof of identity.

**Business email compromise (BEC)** uses email, from a hacked or a lookalike account, to redirect
payments: a "supplier" sends new bank details, or "the CEO" asks for an urgent confidential
transfer. It needs no malware, so security tools often see nothing. The FBI's IC3 counted about
55.5 billion US dollars in exposed losses from more than 305,000 BEC incidents between October
2013 and December 2023.

## Reading a suspicious message

Headers tell you what the message really is. This BEC attempt reached accounts payable:

```text
Authentication-Results: mx1.ferries.example;
 spf=fail smtp.mailfrom=ferrіes.example;
 dkim=none;
 dmarc=fail header.from=ferrіes.example
From: "Dana Whitfield (CEO)" <dana.whitfield@ferrіes.example>
Reply-To: dana.whitfield.ceo@outlook-mail.example
To: accounts.payable@ferries.example
Subject: Urgent: supplier payment before 3 pm, confidential
```

`Authentication-Results` (RFC 8601) is the receiving server's verdict on SPF, DKIM and DMARC. A
few lines of Python find the four warning signs:

```python
from email import message_from_string
from email.utils import parseaddr

msg = message_from_string(raw)          # raw holds the headers above and the body
name, sender = parseaddr(msg["From"])
_, reply_to = parseaddr(msg["Reply-To"])
domain = sender.split("@")[1]
ascii_domain = domain.encode("idna").decode()
results = " ".join(msg["Authentication-Results"].split())

print("display name:", name)
print("from domain:", domain, "->", ascii_domain)
print("reply-to differs:", reply_to.split("@")[1] != domain)
print("lookalike (not our domain):", ascii_domain != "ferries.example")
print("auth failures:", [r for r in ("spf=fail", "dkim=none", "dmarc=fail") if r in results])
```

```text
display name: Dana Whitfield (CEO)
from domain: ferrіes.example -> xn--ferres-svf.example
reply-to differs: True
lookalike (not our domain): True
auth failures: ['spf=fail', 'dkim=none', 'dmarc=fail']
```

The display name is just text anyone can type. The domain looks like `ferries.example` but its
`і` is a Cyrillic letter, which the IDNA encoding exposes as `xn--ferres-svf.example` (a homograph
lookalike). Replies would go to a different mailbox entirely. And the message failed SPF and
DMARC with no DKIM signature. Any one of these would justify a phone call; together they are a
textbook BEC. With DMARC set to `p=reject` on the real domain, an exact spoof would not have been
delivered at all, which is why attackers register lookalikes instead.

## Physical attacks

- **Tailgating**: following an authorized person through a secured door without badging.
  (Piggybacking is the same with the insider's consent.) Access vestibules, turnstiles and
  guards stop it; door "held open" alarms reveal it.
- **Shoulder surfing**: watching someone type a PIN or password, or reading their screen, in
  person or through a camera. Privacy screens, covering the keypad and awareness defeat it.
- **Skimming**: a hidden reader over a card slot (with a camera or keypad overlay for the PIN)
  at an ATM, fuel pump or payment terminal copies card data. Loose or misaligned parts, broken
  tamper seals and unexpected Bluetooth devices nearby are the signs.
- **Forced entry**: breaking a lock, door or window. Alarms, sturdy doors and frames, cameras and
  door sensors that report "forced open" detect it.

Door controllers log what people do:

```text
2026-10-16 07:42:10  DEPOT-STAFF-DOOR  Access Granted    badge 004417 (Priya Shah)
2026-10-16 07:42:11  DEPOT-STAFF-DOOR  Door Opened
2026-10-16 07:42:51  DEPOT-STAFF-DOOR  Door Held Open    open 40 s, limit 30 s
2026-10-16 07:42:58  DEPOT-STAFF-DOOR  Door Closed
2026-10-16 23:17:31  STORES-REAR-DOOR  Door Forced Open  no valid badge, no exit request
```

One badge and a door held open for 40 seconds at the morning rush: a likely tailgate, worth
checking against the camera. A door forced open at 23:17 with no badge and no exit button press
is a break-in until proven otherwise.

## Controls that work

- **Verify out of band**: any change of bank details or unusual payment request is confirmed by
  calling a number already on file, never one from the message; large payments need two people.
- **Email authentication**: SPF, DKIM and DMARC at `p=reject` on your domains, lookalike domain
  monitoring, and external-sender banners. DMARC is now defined by RFC 9989 (2026), which replaced
  RFC 7489; the advanced level covers it in detail.
- **Phishing-resistant MFA**, so a captured password or code is not enough.
- **Awareness training** with realistic simulations, and a one-click report button; reward
  reporting, do not punish clicking.
- **Code words or call-backs** for executive requests, since voices and faces can be faked.
- **Physical**: badges worn visibly, visitor escorts, vestibules for sensitive areas, door alarms
  monitored, and staff who are encouraged to challenge strangers politely.

## Common mistakes

- Trusting the display name, or a familiar voice or face on a call.
- Verifying a request by replying to the same email or calling the number in it.
- Training only once a year, with no simulations and no easy way to report.
- Badge readers on every door, but no alarm when a door is held or forced.

## Practice

1. A text message says a parcel cannot be delivered until a small fee is paid at a link. Which
   attack?
2. The CFO receives a well-researched email, apparently from the board chair, asking for a
   confidential acquisition payment. Which attack, and which control stops it?
3. An email from `payroll@ferries.example` passes SPF and DKIM, but `Reply-To` is a free webmail
   address and the account just changed its mail rules. What has probably happened?
4. A fuel pump's card reader sticks out further than its neighbors. What do you suspect?

### Answers

1. Smishing.
2. Whaling (spear phishing of an executive), as business email compromise. Out-of-band
   verification of the request and two-person approval for payments.
3. The real mailbox is compromised: authentication passes because the message really came from
   it, and the new rules hide the attacker's activity. Reset, revoke sessions, remove the rules.
4. A skimmer overlay. Do not use it, and report it to the station.

## Key takeaways

- Phishing varies by target (spear, whaling) and channel (smishing, vishing, quishing).
- Impersonation, deepfakes and BEC exploit trust; verify out of band, never in the same channel.
- Headers reveal display-name tricks, Reply-To changes, lookalike domains and SPF, DKIM and DMARC
  results.
- Tailgating, shoulder surfing, skimming and forced entry leave physical traces: held and forced
  door events, tampered readers, camera footage.

## Further reading

- [FBI IC3: Business Email Compromise, The $55 Billion Scam](https://www.ic3.gov/PSA/2024/PSA240911)
- [MITRE ATT&CK: Phishing (T1566)](https://attack.mitre.org/techniques/T1566/)
- [RFC 8601: Message Header Field for Indicating Message Authentication Status](https://www.rfc-editor.org/rfc/rfc8601)
- [RFC 9989: Domain-Based Message Authentication, Reporting, and Conformance (DMARC)](https://www.rfc-editor.org/info/rfc9989)
