---
title: Message, Human and Physical Vectors
summary: The ways in that reach people and places, from email, SMS, RCS, chat and collaboration tools to QR codes, fake CAPTCHAs, macro documents, RTF and PDF attachments, impersonators, contractors, visitors, watering holes, malicious USB devices, locks, vestibules, badges and Bluetooth, RF and NFC signals, with the traces each leaves and the controls that stop it (SY0-801 objective 2.3).
minutes: 35
objectives:
  - Name the message-based, image-based and attachment-based vectors and the control for each
  - Triage an attachment for macros, embedded RTF objects and PDF actions
  - Describe the human, external-media and physical vectors, including access vestibules and badge cloning
  - Explain the risks of Bluetooth, RF and NFC signals
---

## Outline

1. Vectors and sources
2. Message-based vectors
3. Image-based vectors
4. Attachment-based vectors
5. Human-based vectors
6. External media
7. Physical and signal-based vectors

## Vectors and sources

A **threat vector** (or attack vector) is the path an actor uses to reach a target; the **attack
surface** is the sum of all of them. This lesson covers the vectors that go through people and
places; the next covers systems, networks and suppliers. MITRE ATT&CK files most of them under
**Initial Access**.

## Message-based vectors

- **Email** remains the main one: links to credential-harvesting pages and malicious attachments
  (ATT&CK T1566, Phishing, with sub-techniques for attachments, links, third-party services and
  voice). Controls: SPF, DKIM and DMARC on your domains, filtering that opens links and
  attachments in a sandbox, external-sender banners, and reporting buttons.
- **SMS** (Short Message Service) and **RCS** (Rich Communication Services, the newer carrier
  messaging with images, read receipts and branded senders): parcel and bank lures that send
  people to fake sites from phones, where URLs are hard to inspect and email filters do not reach.
- **Instant messaging** (WhatsApp, Signal, Telegram): attackers pose as an executive or IT.
- **Collaboration tools** such as Teams and Slack. In 2024 Microsoft described Storm-1811
  flooding users' mailboxes with sign-up spam, then calling or messaging them on Teams from
  outside tenants named "Help Desk", and talking them into a Quick Assist remote session that
  ended in Black Basta ransomware. Controls: restrict external access in Teams to known domains,
  keep the "External" label visible, and remove remote-support tools nobody needs.

## Image-based vectors

- **QR codes** carry a URL that a mail filter cannot read as text and that the user opens on a
  personal phone, outside the company's protections. Phishing with QR codes is called quishing.
- **Embedded content**: remote images (tracking pixels) confirm that an address is live and
  when it was read; SVG images can contain script and HTML; HTML attachments can rebuild a
  malicious file inside the browser. Filters that block or rewrite active content help.
- **CAPTCHA** (Completely Automated Public Turing test to tell Computers and Humans Apart) is
  abused two ways. Phishing pages put a real CAPTCHA in front of the fake login so automated
  scanners never see it. Fake CAPTCHAs, the "ClickFix" lure, tell the user to "verify you are
  human" by pressing Windows+R and pasting a command the page placed on the clipboard; ATT&CK
  added this as T1204.004, Malicious Copy and Paste. The trace is a Run-dialog command line, often
  PowerShell with an encoded payload, started by `explorer.exe` right after a browser visit.

## Attachment-based vectors

- **Embedded macros**: VBA code in Office documents. Since 2022, Microsoft 365 Apps on Windows
  block macros by default in files that carry the **Mark of the Web**, a hidden NTFS stream that
  Windows adds to downloads and attachments:

```ini
[ZoneTransfer]
ZoneId=3
ReferrerUrl=https://mail.example.com/
HostUrl=https://files.example.net/invoice-0412.docm
```

  ZoneId 3 is the Internet zone. Attackers therefore ship documents inside containers or formats
  that may not pass the mark on, and users get told to click "Unblock".
- **RTF** (Rich Text Format) documents carry no macros but can embed OLE objects that exploit the
  application, such as the Equation Editor flaw CVE-2017-11882, which is in CISA's KEV catalog.
- **PDFs** can hold JavaScript, actions that run on opening, launch commands and embedded files.

A first triage looks for those markers, the way tools such as oletools and pdfid do. This
function (from a script that first builds four harmless sample files) checks the zip inside an
Office Open XML file for a VBA project, an RTF for embedded objects, and a PDF for active keys:

```python
import zipfile
from pathlib import Path

PDF_KEYS = [b"/JavaScript", b"/JS", b"/OpenAction", b"/AA", b"/Launch", b"/EmbeddedFile"]


def triage(path):
    data = Path(path).read_bytes()
    if data.startswith(b"PK"):                       # Office Open XML is a zip
        names = zipfile.ZipFile(path).namelist()
        return [n for n in names if n.endswith("vbaProject.bin")] or ["no macros"]
    if data.startswith(b"{\\rtf"):
        return [k for k in ["\\object", "\\objdata", "\\objupdate"] if k.encode() in data] or ["plain RTF"]
    if data.startswith(b"%PDF"):
        return [k.decode() for k in PDF_KEYS if k in data] or ["no active content"]
    return ["unknown type"]


for name in ["invoice-0412.docm", "rota.docx", "order.rtf", "statement.pdf"]:
    print(f"{name:18}", ", ".join(triage(name)))
```

```text
invoice-0412.docm  word/vbaProject.bin
rota.docx          no macros
order.rtf          \object, \objdata, \objupdate
statement.pdf      /JavaScript, /JS, /OpenAction
```

An invoice with a VBA project, an RTF that updates an embedded Equation object when opened, and
a PDF that runs JavaScript on opening all deserve a sandbox, not a user. Note that the file
checks its content, not its extension: renaming does not fool it.

## Human-based vectors

- **Impersonation**: posing as IT, a supplier, a courier or an executive, by phone, chat or in
  person. Help desks are prime targets because they reset passwords and MFA.
- **Contractors** hold real access, often broad and long-lived. Give them named accounts, least
  privilege and an end date.
- **Visitors**: sign in, badge, escort, and a guest network that reaches nothing internal.
- **Biometrics**: a fingerprint or face can be copied from a photo or a mould, and cannot be
  changed once leaked. Use liveness detection and treat biometrics as one factor.
- **Watering hole**: compromise a website the targets already trust, such as a trade
  association's, and serve them malicious code there (ATT&CK T1189, Drive-by Compromise).
  Patched browsers, script and ad blocking, and isolation reduce the risk.

## External media

A **malicious USB** device need not hold files: a "BadUSB" device tells the computer it is a
keyboard and types commands. In January 2022 the FBI warned that FIN7 had mailed such devices to
US companies, disguised as gifts or health-agency letters, to install ransomware tooling. A
dropped USB stick in the car park works the same way. Controls: block unknown USB devices and new
keyboards with endpoint policy, disable autorun, and teach staff to hand found media to IT.

## Physical and signal-based vectors

- **Lock and key**: locks can be picked or bypassed, and keys copied or never returned. Restrict
  key duplication and rekey when keys go missing.
- **Access vestibule** (formerly mantrap): two doors, only one open at a time, with a badge check
  between them, so one badge admits one person.
- **Access passes**: older 125 kHz proximity cards send a fixed number that can be read from a
  short distance and copied; smart cards that authenticate cryptographically resist cloning. A
  cloned badge shows up as impossible movement:

```text
2026-09-22T07:58:12Z  READER=HQ-MAIN-ENTRY  BADGE=004417  NAME=Priya Shah  RESULT=GRANTED
2026-09-22T08:01:40Z  READER=DEPOT-GATE-2   BADGE=004417  NAME=Priya Shah  RESULT=GRANTED
```

  The head office and the depot are 40 km apart; one of those two people is not Priya.
- **Bluetooth**: unsolicited messages (bluejacking), data theft from unpatched devices
  (bluesnarfing) and bugs in Bluetooth stacks. Turn off discoverability, patch, refuse unknown
  pairing requests.
- **RF** (radio frequency): replaying captured signals from fixed-code remotes and gate openers,
  and jamming. Rolling codes and encrypted protocols stop replay.
- **NFC** (near-field communication): ESET described Android malware, NGate (2024), that relayed
  victims' contactless card data to attackers' phones for cash withdrawals. Keep cards in
  shielded sleeves and install apps only from official stores.

## Common mistakes

- Training people about email only, while attacks arrive by SMS, Teams and phone.
- Trusting the extension or icon of an attachment instead of its content.
- Allowing "Enable content" or "Unblock" as a routine step in a business process.
- Badge readers on every door but propped fire exits and no visitor escorts.

## Practice

1. A user received a PDF invoice by email and opened it; endpoint logs show Acrobat starting
   PowerShell. Which vector, and which triage marker would have warned you?
2. A help desk gets a call from "the CFO, travelling" asking for an MFA reset. Which vector, and
   what procedure defeats it?
3. A page says "Verify you are human: press Windows+R, Ctrl+V, Enter". What is it, and what
   evidence will the endpoint hold?
4. Which physical control stops one badge admitting two people?

### Answers

1. Attachment-based (PDF). `/OpenAction` or `/JavaScript` (or `/Launch`) in the file.
2. Human-based impersonation through a voice call. Call back on the number in the directory and
   require identity verification that the caller cannot social-engineer.
3. A fake CAPTCHA (ClickFix, T1204.004). A Run-dialog command, usually PowerShell, launched by
   `explorer.exe`, followed by downloads.
4. An access vestibule.

## Key takeaways

- Messages arrive by email, SMS, RCS, chat and collaboration tools; filter, label and report all.
- QR codes, embedded content and fake CAPTCHAs move the attack where filters cannot see it.
- Macros, RTF objects and PDF actions are the attachment markers to triage.
- People, contractors, visitors, USB devices, badges and radio signals are vectors too.

## Further reading

- [MITRE ATT&CK: Phishing (T1566)](https://attack.mitre.org/techniques/T1566/)
- [MITRE ATT&CK: Malicious Copy and Paste (T1204.004)](https://attack.mitre.org/techniques/T1204/004/)
- [Microsoft Learn: Macros from the internet are blocked by default](https://learn.microsoft.com/en-us/microsoft-365-apps/security/internet-macros-blocked)
- [Microsoft: Threat actors misusing Quick Assist (Storm-1811)](https://www.microsoft.com/en-us/security/blog/2024/05/15/threat-actors-misusing-quick-assist-in-social-engineering-attacks-leading-to-ransomware/)
