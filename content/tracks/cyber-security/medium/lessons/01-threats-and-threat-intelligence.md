---
title: Threats and Threat Intelligence
summary: What a threat is and how likelihood and impact turn it into risk, the intelligence sources and feeds that describe threats (OSINT, commercial, sharing centers, STIX and TAXII, TLP), how to use a feed against your own logs, and the intelligence and attack life cycles (SY0-801 objective 2.1).
minutes: 30
objectives:
  - Distinguish a threat, a vulnerability and a risk, and estimate risk from likelihood and impact
  - Name the main intelligence sources and say what each is good for
  - Read a STIX indicator and a TLP label, and match a threat feed against a firewall log
  - Describe the threat intelligence life cycle and the attack life cycle it tracks
---

## Outline

1. Threat, vulnerability, risk
2. Likelihood and impact
3. Intelligence sources
4. Threat feeds, STIX, TAXII and TLP
5. Using a feed against your logs
6. Two life cycles

## Threat, vulnerability, risk

Security Foundations protected assets with controls. This level turns to what those controls face.
NIST SP 800-30 defines a **threat** as any circumstance or event with the potential to harm an
organization's operations, assets or people through an information system, by unauthorized
access, destruction, disclosure, modification of information or denial of service. A
**threat actor** is whoever carries it out (the next lesson), and a **threat vector** is the path
they use (lessons 4 and 5). A **vulnerability** is a weakness a threat can exploit (lesson 3).
**Risk** is what the combination means for you: in NIST's words, a measure of how far an entity
is threatened, typically a function of the adverse **impact** if the event occurs and the
**likelihood** that it occurs.

A ransomware gang is a threat. An internet-facing VPN appliance missing a patch is a
vulnerability. The risk is high when both meet: the gang is actively exploiting that flaw
(likely) and the VPN is the door to everything (high impact).

## Likelihood and impact

**Likelihood** asks how probable the event is over a period. It rises with the actor's
capability and intent, with how exposed the asset is (internet-facing or internal, how many
people can reach it), and with evidence of active exploitation; it falls with working controls.
**Impact** asks how bad it would be: lost confidentiality, integrity or availability, money,
safety, legal exposure and reputation. Most teams rate both on a small scale and read the result
from a matrix:

```text
              Impact:  Low       Medium    High
Likelihood High        Medium    High      Critical
           Medium      Low       Medium    High
           Low         Low       Low       Medium
```

Threat intelligence is what moves a row: an advisory saying a group is exploiting your VPN
model this week turns "medium" likelihood into "high" before any score changes.

## Intelligence sources

**Threat intelligence** is information about threats that has been collected, analyzed and put in
context so that someone can act on it. It comes at three levels: **strategic** (trends and
actors, for leaders), **operational** (campaigns and the methods behind them, for defenders
planning) and **tactical** (indicators such as IP addresses, domains and file hashes, for tools).

- **Open-source intelligence (OSINT)**: anything public. Government advisories (CISA, the UK
  NCSC), CISA's Known Exploited Vulnerabilities (KEV) catalog, vendor research blogs, free
  community feeds such as abuse.ch, MITRE ATT&CK, and social media posts by researchers.
- **Proprietary or commercial intelligence**: paid feeds and platforms that add their own
  telemetry, analysts, dark web monitoring and support. Better curated, but costly, and only as
  good as their relevance to you.
- **Information sharing organizations**: an **ISAC** (Information Sharing and Analysis Center)
  serves one sector, such as finance or water, and an ISAO serves any community. Members share
  what hit them so the next member is ready. CISA's **Automated Indicator Sharing (AIS)** is a
  free service for exchanging machine-readable indicators and defensive measures with
  government and industry.
- **Internal intelligence**: your own incidents, logs and detections. It is the most relevant
  source of all and the one most often ignored.

NIST SP 800-150 (Guide to Cyber Threat Information Sharing) lists what is worth sharing:
indicators of compromise, the tactics, techniques and procedures (**TTPs**) actors use,
suggested detection and response actions, and the findings of incident analyses.

## Threat feeds, STIX, TAXII and TLP

A **threat feed** is a stream of indicators delivered for machines. The simplest are plain lists
or CSV files. The standard format is **STIX 2.1** (Structured Threat Information Expression),
which describes indicators, malware, threat actors, campaigns and the relationships between them
as JSON objects. **TAXII 2.1** (Trusted Automated Exchange of Intelligence Information) is the
protocol that carries STIX between servers and clients; AIS uses it. This is an indicator from
the STIX documentation, with its description field left out:

```json
{
    "type": "indicator",
    "spec_version": "2.1",
    "id": "indicator--d81f86b9-975b-4c0b-875e-810c5ad45a4f",
    "created": "2014-06-29T13:49:37.079Z",
    "modified": "2014-06-29T13:49:37.079Z",
    "name": "Malicious site hosting downloader",
    "indicator_types": ["malicious-activity"],
    "pattern": "[url:value = 'http://x4z9arb.cn/4712/']",
    "pattern_type": "stix",
    "valid_from": "2014-06-29T13:49:37.079Z"
}
```

The `pattern` is the detection: any observed URL equal to that value matches. `valid_from` matters
because indicators go stale: attackers move to new servers within days, and an IP that hosted a
botnet last year may now belong to an innocent customer of the same provider.

Shared intelligence carries a **Traffic Light Protocol (TLP)** label, version 2.0 of which CISA
adopted in November 2022. **TLP:RED** stays with the named recipients; **TLP:AMBER+STRICT** stays
inside the recipient's organization; **TLP:AMBER** may also go to its clients, on a need-to-know
basis; **TLP:GREEN** may go to the wider community but not to public channels; **TLP:CLEAR** may
be shared freely. Breaking a label is how an organization stops being invited to share.

## Using a feed against your logs

Here is a small command-and-control (C2) IP feed and an excerpt of a firewall log. The
addresses are from the ranges reserved for documentation:

```text
# C2 IP feed, generated 2026-10-14 06:00 UTC, TLP:CLEAR
first_seen_utc,dst_ip,dst_port,malware,confidence
2026-10-09 11:42:10,203.0.113.66,443,QakBot,high
2026-10-12 04:18:55,198.51.100.23,8080,Pikabot,medium
2026-10-13 21:07:31,192.0.2.144,447,Latrodectus,high
```

```bash
# Load the feed's IPs (skip the comment and header), then check each firewall line's destination.
awk -F, 'NR == FNR { if ($0 !~ /^#/ && $2 != "dst_ip") bad[$2] = $4; next }
         { split($6, dst, ":"); if (dst[1] in bad) print $1, $2, $4, "->", $6, "(" bad[dst[1]] ")" }' \
    c2-feed.csv FS=' +' fw.log
```

```text
2026-10-14T08:03:41Z ALLOW 10.40.2.31:49811 -> 203.0.113.66:443 (QakBot)
2026-10-14T08:03:44Z ALLOW 10.40.2.31:49812 -> 203.0.113.66:443 (QakBot)
2026-10-14T08:15:09Z DENY 10.40.3.8:50122 -> 198.51.100.23:8080 (Pikabot)
```

Host 10.40.2.31 reached a QakBot server and the firewall **allowed** it: a likely infection to
investigate now. Host 10.40.3.8 was blocked, but something on it still tried to call out. A SIEM
(security information and event management system) does this matching continuously.

Judge a feed by four qualities: **timeliness** (how fast indicators arrive and expire),
**accuracy** (false positives cost analyst time), **relevance** (indicators for platforms you do
not run are noise) and **confidence** (stated by the source, as in the column above).

## Two life cycles

The objective's "life cycle" has two readings, and you need both.

The **threat intelligence life cycle** is how a team produces intelligence: **direction**
(decide what questions matter, such as "who targets ferry operators?"), **collection** (gather
from the sources above), **processing** (normalize, deduplicate, translate), **analysis** (turn
data into judgments with confidence levels), **dissemination** (a STIX feed for tools, a report
for responders, a one-page brief for executives) and **feedback** (did it help? adjust the
questions). Then it repeats.

The **attack life cycle** is what that intelligence tracks: an intrusion moves from
reconnaissance and initial access through execution, persistence, privilege escalation, lateral
movement and collection to exfiltration or impact. MITRE ATT&CK names these stages as tactics
and gives each technique an ID, so a report can say "T1566 phishing for initial access" and
every reader knows what was seen.

## Common mistakes

- Loading every free feed into the firewall: thousands of stale or shared-hosting IPs block
  legitimate services, and the team learns to ignore alerts.
- Treating an indicator match as proof. A hit means "investigate"; the logs around it decide.
- Never expiring indicators, so last year's botnet IPs keep firing on new owners.
- Sharing TLP:AMBER material in a public chat or ticket.
- Collecting with no direction: no one asked a question, so no one uses the answers.

## Practice

1. A vendor advisory says a group is mass-exploiting a flaw in your file transfer appliance,
   which faces the internet and holds customer contracts. What happens to likelihood and impact?
2. Which source fits each need: (a) indicators from other water utilities, (b) the list of
   vulnerabilities known to be exploited, (c) a machine-readable feed to the SIEM over TAXII?
3. A report is marked TLP:AMBER+STRICT. May you forward it to your managed security provider?
4. In the firewall output above, which host do you look at first, and why?

### Answers

1. Likelihood rises sharply (active exploitation of an exposed asset) and impact is high
   (confidential data). Treat it as critical and act before your next patch cycle.
2. (a) The water sector's ISAC. (b) CISA's KEV catalog (OSINT). (c) A STIX 2.1 feed from AIS or
   a commercial provider, delivered over TAXII 2.1.
3. No. AMBER+STRICT stays inside your own organization; plain AMBER would allow clients and
   partners that need it.
4. 10.40.2.31: its connections to a known C2 server were allowed, so the malware may be talking
   to its operator. The blocked host is next.

## Key takeaways

- A threat can cause harm, a vulnerability lets it, and risk combines likelihood and impact.
- Intelligence comes from OSINT, commercial providers, ISACs and AIS, and your own logs.
- STIX describes intelligence, TAXII carries it, and TLP says who may see it.
- Feeds need timeliness, accuracy, relevance and confidence, and indicators must expire.
- The intelligence life cycle (direction to feedback) tracks the attack life cycle.

## Further reading

- [NIST SP 800-150: Guide to Cyber Threat Information Sharing](https://csrc.nist.gov/pubs/sp/800/150/final)
- [CISA: Automated Indicator Sharing](https://www.cisa.gov/topics/cyber-threats-and-advisories/information-sharing/automated-indicator-sharing-ais)
- [OASIS: Introduction to STIX](https://oasis-open.github.io/cti-documentation/stix/intro.html)
- [CISA: Traffic Light Protocol](https://www.cisa.gov/tlp)
