---
title: Network Attacks
summary: How distributed denial of service, protocol downgrade, rogue access points and DHCP servers, sniffing, spoofing, on-path attacks, DNS attacks and cache poisoning work, what each looks like in network data and logs, and the controls that stop them (SY0-801 objective 2.5).
minutes: 35
objectives:
  - Distinguish volumetric, protocol and application-layer DDoS and name their mitigations
  - Show a protocol downgrade being refused and explain TLS downgrade protection
  - Recognize rogue DHCP, ARP spoofing and on-path attacks in switch and host logs
  - Explain DNS cache poisoning, hijacking and tunneling, and spot tunneling in a query log
---

## Outline

1. Distributed denial of service
2. Protocol downgrade
3. Sniffing, spoofing and on-path attacks
4. Rogue access points and DHCP servers
5. DNS attacks and cache poisoning

## Distributed denial of service

A **denial-of-service (DoS)** attack makes a service unavailable; a **distributed** one (DDoS)
comes from many machines at once, usually a botnet of compromised computers and IoT devices.
CISA's 2024 guide with the FBI and MS-ISAC sorts them into three kinds:

- **Volumetric**: floods of traffic that fill the link. **Amplification** makes them cheap: the
  attacker sends small queries to open DNS, NTP or memcached servers with the victim's address
  as the spoofed source, and the servers send much larger replies to the victim.
- **Protocol**: exhaust state in servers, firewalls or load balancers, for example a SYN flood
  that leaves thousands of half-open TCP connections.
- **Application layer**: requests that look legitimate but are expensive, such as searches or
  logins. HTTP/2 "Rapid Reset" (CVE-2023-44487, added to KEV on 10 October 2023) opened and
  cancelled streams so fast that servers ran out of resources.

Indicators: traffic far above the usual baseline, many sources hitting one target, a flood of
one packet type (SYN, UDP to port 53 from the outside, ICMP), and errors such as timeouts and
503 responses. Mitigations: an upstream scrubbing service or content delivery network, rate
limiting, SYN cookies, autoscaling, and a response plan agreed with your provider in advance.

## Protocol downgrade

A **downgrade attack** forces two parties to use an older, weaker protocol version or cipher than
both support, so the attacker can break it. Two defenses work together. The server refuses old
versions outright, and TLS 1.3 adds a check: a TLS 1.3 server that is pushed down to TLS 1.2 or
lower writes the bytes `44 4F 57 4E 47 52 44` ("DOWNGRD") into its random value, and a TLS 1.3
client that sees them aborts (RFC 8446). TLS 1.0 and 1.1 are deprecated (RFC 8996). This test
server accepts only TLS 1.2 and later:

```bash
openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:P-256 -nodes -days 1 \
  -subj "/CN=booking.test" -keyout key.pem -out cert.pem 2>/dev/null
openssl s_server -accept 8443 -cert cert.pem -key key.pem -min_protocol TLSv1.2 -quiet > /dev/null 2>&1 &
server=$!
sleep 1
echo "client offers TLS 1.1 only:"
openssl s_client -connect 127.0.0.1:8443 -tls1_1 < /dev/null 2>&1 | grep -E 'alert|Cipher is' | head -n 2
echo "client offers TLS 1.3:"
openssl s_client -connect 127.0.0.1:8443 -tls1_3 < /dev/null 2>&1 | grep -E 'Cipher is' | head -n 1
kill $server
```

```text
client offers TLS 1.1 only:
4017A39559740000:error:0A00042E:SSL routines:ssl3_read_bytes:tlsv1 alert protocol version:../ssl/record/rec_layer_s3.c:1602:SSL alert number 70
New, (NONE), Cipher is (NONE)
client offers TLS 1.3:
New, TLSv1.3, Cipher is TLS_AES_256_GCM_SHA384
```

The old client gets a `protocol version` alert and no session at all. A related trick, **SSL
stripping**, keeps the victim on plain HTTP by rewriting links on the way; HTTP Strict Transport
Security (HSTS) tells browsers to use HTTPS for a site always, which defeats it.

## Sniffing, spoofing and on-path attacks

- **Sniffing** is capturing traffic (ATT&CK T1040). On a switched network the attacker must first
  get the traffic to pass them, which is what the next two attacks do. Anything sent in clear
  text, such as Telnet, FTP, HTTP basic authentication or SNMPv1 community strings, is readable.
- **Spoofing** is forging an identity: a source IP address, a MAC address, an email sender, or an
  ARP reply. **ARP spoofing** (ARP cache poisoning, T1557.002) sends forged replies saying "the
  gateway's IP is at my MAC", so hosts send their traffic to the attacker.
- An **on-path attack** (formerly man-in-the-middle; ATT&CK calls it Adversary-in-the-Middle,
  T1557) places the attacker between two parties, reading or changing what passes.

`arpwatch`, a tool that tracks which MAC address each IP uses, logs the moment it changes:

```text
Oct 16 10:02:41 mon01 arpwatch: changed ethernet address 10.40.0.1 0:c:29:5e:a1:07 (0:50:56:9a:10:01) eth0
Oct 16 10:02:44 mon01 arpwatch: flip flop 10.40.0.1 0:50:56:9a:10:01 (0:c:29:5e:a1:07) eth0
```

The gateway, 10.40.0.1, suddenly claims a new MAC address, then flips back and forth: two devices
are answering for one address. Switches stop this with **dynamic ARP inspection**, which drops
ARP replies that do not match the DHCP records; TLS everywhere means a successful on-path
position still yields only encrypted data.

## Rogue access points and DHCP servers

A **rogue** device is one that should not be there. A **rogue access point** is an unauthorized
wireless access point plugged into the network; an **evil twin** (T1557.004) broadcasts the same
network name as the real one so devices join it instead. A **rogue DHCP server** hands out
addresses with the attacker as the default gateway or DNS server (T1557.003), creating an on-path
position for everyone who renews a lease. A switch with **DHCP snooping** trusts DHCP offers only
from the ports where the real servers are, and logs the rest:

```text
Oct 16 10:15:07: %DHCP_SNOOPING-5-DHCP_SNOOPING_UNTRUSTED_PORT: DHCP_SNOOPING drop message on untrusted port, message type: DHCPOFFER, MAC sa: 3c52.821a.2b3c
```

An offer from an untrusted port means someone is running a DHCP server where there should be a
desk. Wireless intrusion prevention (WIPS) and 802.1X find rogue and twin access points.

## DNS attacks and cache poisoning

The Domain Name System (DNS) turns names into addresses, so whoever controls the answers controls
where traffic goes.

- **Cache poisoning**: inserting a forged answer into a resolver's cache, so every client of that
  resolver is sent to the attacker. The 2008 "Kaminsky bug" (CVE-2008-1447) showed it could be
  done quickly because transaction IDs and source ports were not random enough; resolvers now
  randomize both, and **DNSSEC** lets resolvers verify that answers are signed by the zone owner.
- **DNS hijacking**: changing the real records, usually with stolen registrar or DNS hosting
  credentials. CISA's Emergency Directive 19-01 (January 2019) told agencies to audit their
  records, change those passwords, add MFA and watch Certificate Transparency logs for
  certificates they had not requested.
- **DNS tunneling**: hiding data or command traffic inside DNS queries, which firewalls often
  allow. The sign is many queries with long, random-looking labels to one domain, often of type
  TXT. A resolver's query log, checked for long first labels:

```bash
awk '$7 == "query:" {
  name = $8; split(name, l, "."); n = split(name, all, ".")
  parent = all[n-2] "." all[n-1] "." all[n]
  client = $5; sub(/#.*/, "", client)
  if (length(l[1]) >= 25) long[client " " parent " " $10]++
} END { for (k in long) print k, long[k], "long labels" }' queries.log
```

```text
10.40.3.8 d1.example.org TXT 3 long labels
```

One workstation sent three TXT queries in one second, each with a 32-character encoded label, to
the same domain: investigate the host and block the domain at the resolver.

## Common mistakes

- Leaving TLS 1.0 or 1.1 enabled "for one old client", which keeps the downgrade path open.
- Trusting the internal network: ARP spoofing and rogue DHCP need only a network port.
- Planning DDoS response during the attack instead of with the provider beforehand.
- Allowing endpoints to use any DNS server, so neither filtering nor query logging sees them.

## Practice

1. A switch logs DHCPOFFER messages dropped on an access port in a meeting room. What is
   happening, and which control stopped it?
2. Your web servers see a sudden flood of large DNS responses from thousands of open resolvers,
   although they never sent queries. Which attack?
3. Two log lines show the gateway's MAC changing back and forth. Which attack, and which switch
   feature prevents it?
4. Why does HSTS defeat SSL stripping?

### Answers

1. A rogue DHCP server is plugged in there; DHCP snooping dropped its offers because the port is
   untrusted.
2. A DNS amplification (reflection) DDoS: the attacker spoofed the servers' address as the source
   of small queries.
3. ARP spoofing (ARP cache poisoning) for an on-path position; dynamic ARP inspection.
4. The browser has been told to use HTTPS for that site always, so it never makes the plain HTTP
   request that the attacker needs to rewrite.

## Key takeaways

- DDoS is volumetric, protocol or application layer; plan mitigation with your provider.
- Downgrades are refused by disabling old versions; TLS 1.3 also detects them.
- ARP spoofing and rogue DHCP create on-path positions; dynamic ARP inspection and DHCP
  snooping stop them, and encryption limits what is exposed.
- DNS is attacked by poisoning, hijacking and tunneling; DNSSEC, MFA on DNS accounts and query
  logging defend it.

## Further reading

- [CISA: Understanding and Responding to Distributed Denial-of-Service Attacks](https://www.cisa.gov/resources-tools/resources/understanding-and-responding-distributed-denial-service-attacks)
- [RFC 8446: TLS 1.3, section 4.1.3 (downgrade protection)](https://www.rfc-editor.org/rfc/rfc8446#section-4.1.3)
- [MITRE ATT&CK: Adversary-in-the-Middle (T1557)](https://attack.mitre.org/techniques/T1557/)
- [CISA: Emergency Directive 19-01, Mitigate DNS Infrastructure Tampering](https://www.cisa.gov/news-events/directives/ed-19-01-mitigate-dns-infrastructure-tampering)
