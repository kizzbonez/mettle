---
title: Threat Actors and Motivations
summary: The threat actors Security+ names (crime syndicates, state-sponsored groups, hacktivists, unskilled attackers, insiders, accidental insiders, competitors, terrorists), their motivations, the attributes that separate them (internal or external, resources, sophistication) and advanced persistent threats, with real cases from CISA and FBI advisories (SY0-801 objectives 2.2 and 2.3).
minutes: 30
objectives:
  - Describe each threat actor type with its usual motivations, resources and capability
  - Classify an actor from evidence as internal or external and by sophistication
  - Explain what makes a threat an advanced persistent threat and what it leaves behind
  - Build a simple threat landscape for an organization from its own incident history
---

## Outline

1. Why the actor matters
2. The actors
3. Motivations
4. Attributes: internal or external, resources, sophistication
5. Advanced persistent threats
6. Your own threat landscape

## Why the actor matters

The previous lesson defined a threat. A **threat actor** is the person or group behind it. Knowing
who is likely to come tells you what they want, how hard they will try and which controls will
stop them. A teenager renting a denial-of-service attack and a foreign intelligence service both
"attack the network", but one gives up after an afternoon and the other waits years.

## The actors

- **Unskilled attacker** (once called a script kiddie): uses tools, scripts and attack services
  made by others, such as rented DDoS (distributed denial of service) "booter" services. Little
  capability, often motivated by **notoriety** or **general curiosity**. Basic hygiene (patching,
  MFA, DDoS protection) defeats most of them.
- **Hacktivist**: attacks for a cause, with **ideological** or **political** motives: website
  defacement, DDoS, leaking documents. In May 2024 CISA, the FBI, NSA and partners warned that
  pro-Russia hacktivists were manipulating exposed industrial control systems in water, dams,
  energy and agriculture; the techniques were "mostly limited to unsophisticated" ones, yet could
  cause physical effects in insecure, misconfigured operational technology.
- **Organized crime (crime syndicate)**: run like a business for **financial** gain and
  **extortion**: ransomware, data theft, business email compromise, selling stolen access. Well
  funded and specialized, often renting tools to affiliates. Scattered Spider, which MITRE ATT&CK
  (group G1015) describes as a native English-speaking cybercriminal group active since at least
  2022, phones IT help desks pretending to be employees to get passwords reset and MFA moved,
  then steals data and deploys ransomware; CISA's advisory AA23-320A (updated July 2025)
  documents it.
- **State-sponsored (nation-state) actor**: works for a government, for **espionage**,
  **influence**, theft of **intellectual property**, or to pre-position for conflict. The most
  resources and capability. Some states also steal for money: the FBI attributed the theft of
  about 1.5 billion US dollars in virtual assets from the Bybit exchange in February 2025 to North
  Korea ("TraderTraitor").
- **Insider**: someone with legitimate access (employee, contractor, partner) who misuses it,
  for **revenge** after a dismissal, for money, or for a competitor. Insiders bypass the
  perimeter because they are already inside.
- **Accidental or unintentional insider**: no malice at all. A misdirected email, a storage link
  shared with "anyone", a phishing click. The harm is real even though the intent is not.
- **Competitor**: a rival organization seeking **intellectual property**, bids, customer lists or
  disruption, usually through an insider or a hired intermediary.
- **Terrorist**: aims to cause **fear and chaos** or physical harm for a political goal; the
  worst case is an attack on critical infrastructure that endangers lives.

## Motivations

SY0-801 lists twelve: **financial**, **influence** (shaping opinion or elections), **intellectual
property**, **notoriety**, **espionage**, **fear/chaos**, **extortion**, **general curiosity**,
**revenge**, **ideological**, **political** and **ethical**. An ethical motive drives someone who
believes the act is right: a researcher who probes a system to report a flaw (legal only with
permission, such as a bug bounty), or an insider who leaks evidence of wrongdoing. One actor can
have several motives: ransomware gangs combine financial gain with extortion, and a state may
combine espionage with influence.

## Attributes: internal or external, resources, sophistication

Security+ separates actors by three **attributes**:

| Actor | Internal or external | Resources and funding | Sophistication |
| --- | --- | --- | --- |
| Unskilled attacker | External | Very low | Low |
| Hacktivist | External (sometimes inside sympathizers) | Low to medium | Low to medium |
| Crime syndicate | External | High | Medium to high |
| State-sponsored | External | Very high | Very high |
| Insider, accidental insider | Internal | Their own access | Varies |
| Competitor | External, often via an insider | Medium to high | Medium |

**Internal** actors start with credentials and knowledge, so access controls, least privilege,
logging and offboarding matter most. **External** actors must first get in, so the attack
surface (lessons 4 to 6) matters most. Resources buy time, custom tools and zero-day exploits;
sophistication shows in how well an actor hides.

## Advanced persistent threats

An **advanced persistent threat (APT)** is an actor, usually state-sponsored, that is
**advanced** (capable, patient, well resourced) and **persistent** (it keeps access for months or
years rather than smashing and grabbing). The joint advisory AA24-038A (February 2024) on Volt
Typhoon, a People's Republic of China state-sponsored actor, is a model: the agencies assessed it
was pre-positioning in US communications, energy, transportation and water networks for
disruption in a crisis, and had kept footholds in some victims "for at least five years". Its
hallmark was **living off the land**: using built-in Windows tools and valid accounts instead of
malware, so antivirus has nothing to find. What it leaves is legitimate tools used oddly, such as
this process-creation event (written in the format of Windows event 4688, "A new process has been
created"):

```text
EventID 4688  Computer: DC02.corp.example  2026-08-12T02:41:07Z
Creator Process Name:  C:\Windows\System32\wbem\WmiPrvSE.exe
New Process Name:      C:\Windows\System32\ntdsutil.exe
Process Command Line:  ntdsutil.exe "ac i ntds" "ifm" "create full C:\Windows\Temp\pro" q q
Account Name:          svc-backup
```

`ntdsutil ... ifm create full` copies the Active Directory database, which holds every domain
password hash, into a folder. Administrators do it rarely; done at 02:41, started remotely through
WMI (Windows Management Instrumentation) by a backup service account, it is a strong indicator
of credential theft (ATT&CK T1003.003). Defenses against APTs are the basics done thoroughly:
patch exposed appliances fast, phishing-resistant MFA, least privilege for service accounts, and
logging good enough to spot tools used out of character.

## Your own threat landscape

Advisories describe the world; your incident history describes your organization. A small ferry
operator kept this record:

```text
opened,actor,motivation,origin,summary
2025-11-03,crime syndicate,financial,external,Invoice fraud email to accounts payable
2025-12-14,unskilled attacker,notoriety,external,DDoS-for-hire attack on the booking site
2026-01-20,accidental insider,none,internal,Customer list emailed to the wrong partner
2026-02-07,hacktivist,political,external,Website defaced during a fare protest
2026-03-02,crime syndicate,extortion,external,Ransomware on two file servers
2026-04-18,insider,revenge,internal,Dismissed admin deleted VM snapshots
2026-05-09,crime syndicate,financial,external,Stolen VPN password sold and used
2026-06-30,accidental insider,none,internal,Public link to a shared drive with crew rosters
2026-08-12,state-sponsored,espionage,external,Router implant found during firmware audit
```

```python
import csv
from collections import Counter

with open("incidents.csv", newline="") as f:
    incidents = list(csv.DictReader(f))

by_actor = Counter(row["actor"] for row in incidents)
by_origin = Counter(row["origin"] for row in incidents)
for actor, count in by_actor.most_common():
    motives = sorted({row["motivation"] for row in incidents if row["actor"] == actor})
    print(f"{actor:20} {count}  motives: {', '.join(motives)}")
print(dict(by_origin))
```

```text
crime syndicate      3  motives: extortion, financial
accidental insider   2  motives: none
unskilled attacker   1  motives: notoriety
hacktivist           1  motives: political
insider              1  motives: revenge
state-sponsored      1  motives: espionage
{'external': 6, 'internal': 3}
```

A third of the incidents were internal, and two of them were accidents: training, data loss
prevention and sharing defaults would have stopped them. The revenge case points at offboarding:
the dismissed administrator still had access to the virtualization platform.

## Common mistakes

- Assuming "nobody would target us". Crime syndicates and unskilled attackers choose victims by
  weakness, not by size.
- Treating every insider incident as malicious. Most are accidents, which call for better
  defaults and training rather than discipline.
- Calling any skilled attack an APT. Persistence and resources define it, not one clever exploit.
- Revoking a leaver's account but not their VPN, cloud, shared and service accounts.

## Practice

1. A group defaces a ferry company's website with slogans against a fare rise. Which actor, which
   motive?
2. Logs show a domain admin account running `ntdsutil` at 3 a.m. through WMI, with no change
   ticket. Internal or external actor, and what do you check first?
3. Which attribute most separates a state-sponsored actor from a crime syndicate?
4. An employee uploads a confidential price list to a public file-sharing site to work from home.
   Which actor type?

### Answers

1. A hacktivist, with a political (or ideological) motive.
2. Unknown until proven: an external actor using stolen credentials looks exactly like this. Check
   where the WMI connection came from, whether the account's owner did it, and whether the
   output folder was copied anywhere.
3. Resources and funding (and with them, sophistication and patience). Motives can overlap.
4. An accidental (unintentional) insider: no harmful intent, but a real data exposure.

## Key takeaways

- Actors differ in motive, in being internal or external, in resources and in sophistication.
- Crime syndicates want money, states want intelligence and leverage, hacktivists want attention
  for a cause, and insiders already have access.
- APTs are capable and patient; living-off-the-land activity is their typical trace.
- Build the threat landscape from your own incidents as well as from advisories.

## Further reading

- [CISA advisory AA24-038A: PRC state-sponsored actors (Volt Typhoon)](https://www.cisa.gov/news-events/cybersecurity-advisories/aa24-038a)
- [CISA advisory AA23-320A: Scattered Spider](https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-320a)
- [CISA: Defending OT operations against pro-Russia hacktivist activity](https://www.cisa.gov/resources-tools/resources/defending-ot-operations-against-ongoing-pro-russia-hacktivist-activity)
- [MITRE ATT&CK: Volt Typhoon (G1017)](https://attack.mitre.org/groups/G1017/)
