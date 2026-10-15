---
title: Monitoring, Alerting and SIEM
summary: Monitor systems, applications and infrastructure and turn their data into useful alerts (SY0-801 objective 4.4, with the deception tools of 4.1). Aggregate and archive logs, read syslog, SNMP, NetFlow and SCAP data, write and tune SIEM correlation rules, and plant honeypots, honeyfiles, honeytokens and canary accounts.
minutes: 40
objectives:
  - Describe what to monitor on systems, applications and infrastructure and the activities of a monitoring program
  - Read syslog priorities, explain SNMP versions, analyze flow records and interpret SCAP benchmark results
  - Explain what a SIEM does, write a correlation rule and tune alerts without creating blind spots
  - Choose agents or agentless collection, port mirroring and deception tools for a monitoring need
---

## Outline

1. What to monitor
2. Monitoring activities
3. Protocols: syslog, SNMP, NetFlow and IPFIX, SCAP
4. Tools
5. Correlation, automated alerts and tuning
6. Deception and disruption

This lesson covers SY0-801 objective 4.4 and the deception bullets of 4.1.

## What to monitor

- **Systems**: CPU, memory, disk and services, plus security events such as logons, privilege
  use, new services and changes to security settings.
- **Applications**: errors, authentication and authorization events, and unusual business
  activity such as a refund spike.
- **Infrastructure**: switches, routers, firewalls, hypervisors, links and the cloud control
  plane (who created or deleted what).

## Monitoring activities

**Log aggregation** collects logs from every source into one place, parses them into common
fields and relies on synchronized clocks (Network Time Protocol). **Alerting** notifies people
when a condition is met. **Scanning** (vulnerability and configuration scans) adds what the
hosts are, not only what they did. **Archiving** keeps logs for the retention period the policy
or regulation sets, protected against change. **Reporting** turns the data into compliance and
management reports. **Alert tuning** keeps the alerts worth reading.

## Protocols: syslog, SNMP, NetFlow and IPFIX, SCAP

**Syslog** (RFC 5424) is the standard log message format of Unix systems and network devices.
Each message starts with a priority value, PRI, which equals facility × 8 + severity. Severities
run from 0 (emergency) to 7 (debug); facility 4 is security/authorization and 16 to 23 are
`local0` to `local7`. Messages travel over UDP port 514 traditionally, and over TLS (RFC 5425)
when they must be protected. Four messages from `syslog.txt`:

```text
<38>1 2026-10-14T02:11:52.184Z bastion-01 sshd 4120 - - Accepted publickey for deploy from 10.20.8.15 port 50122 ssh2
<86>1 2026-10-14T02:12:03.901Z bastion-01 sudo 4188 - - deploy : TTY=pts/0 ; PWD=/home/deploy ; USER=root ; COMMAND=/usr/bin/systemctl restart nginx
<165>1 2026-10-14T02:12:30.002Z core-sw-01 IFMGR - LINKDOWN [origin ip="10.20.0.2"] Interface Gi1/0/24 changed state to down
<131>1 2026-10-14T02:13:44.517Z erp-app-01 payroll 977 - - Database connection pool exhausted (64/64)
```

```bash
sev=(emerg alert crit err warning notice info debug)
while read -r line; do
  pri=${line#<}; pri=${pri%%>*}
  host=$(cut -d' ' -f3 <<< "$line"); app=$(cut -d' ' -f4 <<< "$line")
  printf '%-4s facility %-2d severity %d (%-7s) %s %s\n' "$pri" $((pri / 8)) $((pri % 8)) "${sev[pri % 8]}" "$host" "$app"
done < syslog.txt
```

```text
38   facility 4  severity 6 (info   ) bastion-01 sshd
86   facility 10 severity 6 (info   ) bastion-01 sudo
165  facility 20 severity 5 (notice ) core-sw-01 IFMGR
131  facility 16 severity 3 (err    ) erp-app-01 payroll
```

**SNMP**, the Simple Network Management Protocol, lets a manager poll devices on UDP port 161 for
values defined in a Management Information Base (MIB), such as interface counters, and lets
devices send **traps** to the manager on UDP 162. Versions 1 and 2c authenticate with a
**community string** sent in clear text (often left as `public`); SNMPv3 adds user-based
authentication and encryption, and its `authPriv` level should be the only one allowed.

**NetFlow** (Cisco, version 9 in RFC 3954) and its IETF standard successor **IPFIX** (IP Flow
Information Export, RFC 7011) record conversations, not content: addresses, ports, protocol,
times, packets and bytes. Flows show volume and direction, which is enough to spot
exfiltration. Summing bytes from internal to external addresses in a collector's export:

```bash
awk -F, 'NR > 1 && $3 ~ /^10\./ && $5 !~ /^10\./ { sent[$3 " -> " $5 ":" $6] += $9 }
  END { for (k in sent) printf "%-34s %14d bytes%s\n", k, sent[k], (sent[k] > 1e9 ? "  ALERT" : "") }' flows.csv | sort -k4,4nr
```

```text
10.20.2.14 -> 203.0.113.77:443         2308043462 bytes  ALERT
10.20.4.31 -> 198.51.100.10:443             38220 bytes
10.20.4.57 -> 198.51.100.10:443              9411 bytes
```

A warehouse server sent 2.3 GB to one outside address between 02:00 and 03:00. The flows cannot
say what was sent; a packet capture or the host itself must.

**SCAP**, the Security Content Automation Protocol, is NIST's suite of standards for automated
checks: XCCDF expresses checklists, OVAL describes how to test a system's state, CPE names
platforms, CCE names configuration settings, CVE and CVSS name and score vulnerabilities, and
ARF formats results. Version 1.3 (NIST SP 800-126 Rev. 3) is current and 1.4 is in development.
**Benchmarks** such as the Center for Internet Security (CIS) Benchmarks and the US Defense
Department's STIGs are published as SCAP content, so a scanner can test a host against them. An
excerpt of OpenSCAP's `oscap xccdf eval` output (identifier lines omitted):

```text
Title   Disable SSH Root Login
Rule    xccdf_org.ssgproject.content_rule_sshd_disable_root_login
Result  fail

Title   Uninstall telnet-server Package
Rule    xccdf_org.ssgproject.content_rule_package_telnet-server_removed
Result  pass
```

## Tools

- A **security information and event management (SIEM)** system aggregates, normalizes,
  correlates, alerts on, searches and retains security data.
- **Agents** run on the host and collect rich data even off the network, but must be deployed
  and maintained. **Agentless** collection uses syslog, APIs or remote queries: nothing to
  install, less detail.
- **Antivirus** and **data loss prevention (DLP)** send their detections to the SIEM; DLP
  watches sensitive data leaving by email, web upload or USB.
- **Vulnerability scanners** add context: an exploit attempt against an unpatched host is worse.
- **Orchestration** platforms run response actions across tools (lesson 4).
- **Packet analyzers** (Wireshark, `tcpdump`) capture whole packets. **Port mirroring** (a
  switch's SPAN port) or a network TAP copies traffic to the sensor without touching the path.
- A **network management system (NMS)** polls devices for health and topology, mostly by SNMP;
  **dashboards** show the state at a glance for analysts and managers.

## Correlation, automated alerts and tuning

A **correlation rule** joins many events into one meaningful alert. This rule in Sigma, an open
rule format that SIEM tools convert to their own queries, fires when one source fails to log on
to 20 or more different accounts within 10 minutes, the shape of password spraying:

```yaml
title: Failed network logon
name: failed_network_logon
id: 7d1f4c2e-5b0a-4f8e-9c63-2a1e4d9b8f10
logsource:
  product: windows
  service: security
detection:
  selection:
    EventID: 4625
    LogonType: 3
  condition: selection
---
title: Password spraying from one source
id: 3a8e6f51-0c2d-4b7a-a4e9-6f2b1c7d9e03
correlation:
  type: value_count
  rules:
    - failed_network_logon
  group-by:
    - IpAddress
  timespan: 10m
  condition:
    field: TargetUserName
    gte: 20
level: high
```

Every alert ends as a **true positive** (real and flagged), a **false positive** (flagged, not
real), or, invisibly, a **false negative** (real, missed). Too many false positives cause alert
fatigue, and fatigue causes missed attacks. **Tune** by adjusting thresholds to measured
baselines, adding context (asset criticality, known scanners), and suppressing a specific benign
source with a recorded reason and an expiry date. Never disable the rule.

## Deception and disruption

Decoys have no legitimate use, so any touch is suspicious and false positives are rare:

- **Honeypot**: a decoy system that looks valuable and records what intruders do.
- **Honeynet**: a network of honeypots imitating a real environment.
- **Honeyfile**: a decoy document, such as `passwords-2026.xlsx` on a file share, that alerts
  when opened.
- **Honeytoken**: fake data that alerts when used, such as an unused cloud access key planted in
  a repository or a fake customer record whose email address is monitored.
- **Canary account**: an attractive account nobody uses; any logon attempt raises an alert.

Keep decoys isolated so they cannot become a foothold, and make sure their alerts reach the SIEM.

## Common mistakes

- Collecting logs without synchronized time, so events cannot be ordered.
- Leaving SNMP v1 or v2c enabled with the `public` community.
- Tuning by disabling noisy rules instead of fixing thresholds and context.
- Forwarding logs over plain UDP with nothing to detect gaps or changes.
- Placing a honeypot where an intruder can pivot from it into production.

## Practice

1. Decode `<4>` and `<85>`.
2. Which data shows that a host sent 2 GB to a new address, and which shows what it sent?
3. The spraying rule fires every night for the vulnerability scanner. What do you change?
4. Name the deception tool: an account `svc-backup-old` that should never log on.

### Answers

1. `<4>` is facility 0 (kernel), severity 4 (warning); `<85>` is facility 10
   (security/authorization), severity 5 (notice).
2. NetFlow or IPFIX records show the volume; a packet capture (or the host) shows the content.
3. Add a narrow exception for the scanner's address and scheduled window, with an owner and an
   expiry, and keep the rule active for every other source.
4. A canary account.

## Key takeaways

- Monitor systems, applications and infrastructure; aggregate, alert, scan, archive and report.
- Syslog PRI = facility × 8 + severity; use SNMPv3 `authPriv`; flows show who, when and how much.
- SCAP turns benchmarks into automated checks; a SIEM correlates events into alerts.
- Tune with thresholds and context, never by disabling; decoys give high-confidence alerts.

## Further reading

- [RFC 5424: The Syslog Protocol](https://www.rfc-editor.org/rfc/rfc5424.html)
- [RFC 7011: IPFIX Protocol Specification](https://www.rfc-editor.org/rfc/rfc7011.html)
- [NIST Security Content Automation Protocol](https://csrc.nist.gov/projects/security-content-automation-protocol)
- [Sigma Correlation Rules Specification](https://sigmahq.io/sigma-specification/specification/sigma-correlation-rules-specification.html)
