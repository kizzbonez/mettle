Skerry Line runs six ferries between a mainland harbour and three islands. Passengers book on
the website, scan their tickets at boarding gates, and use the Wi-Fi portal on board; crews are
rostered by an internal application, and payment files travel to the card processor and the
port authority through a managed file transfer server. A breach or an outage here does not only
leak data: it can leave cars queuing on the quay and islanders without their sailing.

The security team is two people. Every week the vulnerability scanner exports what it found, and
every quarter the risk committee (the chief executive, the finance director and the heads of
operations) reviews the risk register. Until now both were done by hand in spreadsheets: the
scan export was sorted by CVSS score, and the risk register was filled in from memory.

The October scan export, taken on 12 October, is messy in the ways real exports are. The same
Log4Shell finding on the booking site appears twice, once from each scan policy, with different
first-seen dates. Some host names have stray spaces or capital letters, one CVE id is in lower
case, informational findings with no CVE are mixed in, and a storage box called `nas-07` answers
on the network although nobody has ever registered it.

```text
finding_id,host,ip,port,cve,cvss,title,first_seen
F-0998,book-web-01,10.40.1.11,443,CVE-2021-44228,10.0,Apache Log4j2 JNDI remote code execution,2026-10-02
F-1001,book-web-01,10.40.1.11,443,CVE-2021-44228,10.0,Apache Log4j2 JNDI remote code execution,2026-09-28
F-1003,BOOK-WEB-01,10.40.1.11,22,cve-2023-48795,5.9,SSH Terrapin prefix truncation,2026-08-03
...
F-1017,nas-07,10.40.9.17,5001,CVE-2016-2183,7.5,SWEET32 birthday attack on 64-bit block ciphers,2026-09-07
```

Alongside it you have the asset inventory, with each host's owner, criticality, exposure and
value; an excerpt of CISA's Known Exploited Vulnerabilities catalog; the risks the committee
has written down, each with an exposure factor and an industry estimate of how often it
happens; and five years of the company's own incident and loss history.

The committee meets on 16 October. It wants two things it can act on: a remediation list
ordered by the rules the security team agreed (known exploitation, exposure and asset
criticality before raw CVSS), with each finding's service-level due date and whether it is
already late; and a risk register summary that puts a dollar figure on each risk, shows the
open findings on the systems behind it, and says which risks exceed the committee's appetite
and need action. You are writing the module that produces both.
