---
title: Firewalls, IDS/IPS and Filtering
summary: Write and review rule-based firewall policies, tell layer 4 from layer 7 filtering, rate-limit abuse, place a WAF or UTM, read Suricata-style IDS/IPS rules and alerts, and filter content with proxies, agents and DLP (SY0-801 objective 4.1).
minutes: 40
objectives:
  - Read an ordered firewall policy, find shadowed and overly broad rules, and explain layer 4 versus layer 7 filtering
  - Configure rate limiting in a host firewall and a web server, and describe what a WAF and a UTM appliance add
  - Write and interpret Suricata-style rules and alerts, and compare NIDS/NIPS, HIDS/HIPS and WIPS
  - Choose between a centralized proxy and agent-based content filtering, and explain what DLP inspects
---

## Outline

1. Rule-based firewalls
2. Layer 4 and layer 7
3. Rate limiting
4. WAF and UTM
5. Intrusion detection and prevention
6. Content filtering and DLP

## Rule-based firewalls

A **rule-based firewall** compares each connection with an ordered list of rules. The **first match wins**, and a final **implicit deny** drops whatever no rule allowed. A **stateful** firewall remembers allowed connections and lets their replies through; a stateless one judges each packet alone. Here is a policy exported from a perimeter firewall, written vendor-neutrally:

```text
#  Source         Destination    Service   Action  Hits (30 days)
1  any            10.20.0.15     tcp/443   allow   1,204,331
2  10.10.0.0/16   10.20.0.0/24   any       allow   88,412
3  10.10.5.0/24   10.20.0.30     tcp/3389  deny    0
4  any            any            any       deny    5,920  (implicit)
```

Rule 3 was meant to stop the contractor subnet from using remote desktop on a server, but it is **shadowed**: every connection it could match (10.10.5.0/24 is inside 10.10.0.0/16, 10.20.0.30 is inside 10.20.0.0/24, and tcp/3389 is inside "any") already matched rule 2. Its hit count of zero is the tell. Move it above rule 2. Rule 2 is also **overly broad**: "any service" between two networks means the policy says nothing about which applications are needed. A **rule review** looks for exactly these, plus rules nobody can explain and rules with no hits for months.

## Layer 4 and layer 7

A **layer 4** firewall decides from IP addresses, protocol (TCP, UDP) and port numbers. It is fast, but it trusts the port: anything sent to tcp/443 is "HTTPS" to it. A **layer 7** (application-aware, or next-generation) firewall identifies the application itself, whatever port it uses, can apply rules per user and per application function (allow a SaaS app, block its file upload), and with TLS inspection can look inside encrypted traffic. It costs more processing and must hold a trusted certificate to decrypt, which is itself a sensitive key.

## Rate limiting

**Rate limiting** caps how often a source may do something, a cheap defense against password guessing, scraping and some denial of service. In nftables, a dynamic set tracks each source address (syntax from the nftables manual's set and limit statements):

```text
table inet filter {
    set ssh_flood {
        type ipv4_addr
        flags dynamic
        timeout 60s
        size 65536
    }
    chain input {
        type filter hook input priority filter; policy drop;
        ct state established,related accept
        iifname "lo" accept
        tcp dport 22 ct state new add @ssh_flood { ip saddr limit rate over 6/minute } drop
        tcp dport { 22, 443 } accept
    }
}
```

An address opening more than six new SSH connections a minute is dropped; others continue to the accept rule. At layer 7 the web server can limit one URL. nginx's `limit_req` module does it per client address:

```nginx
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

server {
    location = /login {
        limit_req zone=login burst=3 nodelay;
        limit_req_status 429;
        proxy_pass http://app;
    }
}
```

Five login attempts a minute per address, a burst of three, and status 429 (Too Many Requests) instead of the default 503. Rate limits by address do not stop a password spray spread over thousands of addresses, so pair them with account-level lockout or throttling.

## WAF and UTM

A **web application firewall (WAF)** inspects HTTP requests and responses for attacks on the application: SQL injection, cross-site scripting, path traversal. Most deployments use a maintained rule set such as the OWASP Core Rule Set rather than handwritten rules. ModSecurity's rule language looks like this:

```text
SecRule ARGS "@detectSQLi" "id:100010,phase:2,deny,status:403,log,msg:'SQL injection in a parameter'"
```

A WAF can also **virtually patch** a known flaw while the code fix is prepared. It is a compensating control, not a substitute for input validation in the code.

A **unified threat management (UTM)** appliance combines firewall, IPS, gateway antivirus, content filtering and VPN in one box. It suits small sites with little staff, at the cost of a single point of failure and a performance ceiling when every feature is on.

## Intrusion detection and prevention

An **intrusion detection system (IDS)** watches and alerts; an **intrusion prevention system (IPS)** sits inline and can also block. **Network-based** systems (NIDS, NIPS) watch traffic at a choke point. **Host-based** systems (HIDS, HIPS) run on a server or endpoint and watch its logs, processes and files; file integrity monitoring of system binaries is a classic HIDS job. A **wireless IPS (WIPS)** listens to the radio spectrum for rogue access points, evil twins (fake access points with a trusted name) and deauthentication floods, and can contain them.

Detection is either **signature-based** (matches known patterns: precise, blind to new attacks) or **anomaly-based** (compares with a learned baseline: catches the new, at the price of more false positives). Suricata and Snort rules are signatures. Each rule has an action, a header and options:

```text
drop http $EXTERNAL_NET any -> $HTTP_SERVERS any (msg:"LOCAL Path traversal in URI"; flow:established,to_server; http.uri.raw; content:"../"; classtype:web-application-attack; sid:1000001; rev:2;)
alert tcp $EXTERNAL_NET any -> $HOME_NET 22 (msg:"LOCAL Possible SSH brute force"; flow:to_server; flags:S; detection_filter:track by_src, count 10, seconds 60; classtype:attempted-recon; sid:1000003; rev:1;)
```

The first looks in the raw URI, before Suricata normalizes the path, for `../`, and drops the packet when Suricata runs inline as an IPS; in passive IDS mode it can only alert. The second alerts on every SYN to port 22 from a source after its first ten within 60 seconds. Local rules use signature IDs from 1000000 so they never collide with published rule sets. Suricata writes alerts as JSON lines to `eve.json`, which `jq` summarizes:

```console
$ jq -r 'select(.event_type == "alert")
  | [.src_ip, "->", .dest_ip + ":" + (.dest_port | tostring), .alert.action, .alert.signature]
  | join(" ")' eve.json | sort | uniq -c | sort -rn
      3 203.0.113.77 -> 10.20.0.15:443 blocked LOCAL Path traversal in URI
      2 198.51.100.23 -> 10.20.0.10:22 allowed LOCAL Possible SSH brute force
```

`blocked` means the inline engine dropped the traffic; `allowed` means it only alerted, so someone must follow up on 198.51.100.23. Tuning matters: a rule that fires a thousand times a day on harmless traffic trains analysts to ignore it.

## Content filtering and DLP

**Content filtering** decides which web content users may reach, by URL category, reputation or file type. It is delivered two ways:

- A **centralized proxy** receives all web traffic from the network (configured on browsers or intercepted at the gateway). One policy, one log, but it protects only traffic that passes through it.
- **Agent-based** filtering runs on each endpoint, so the same policy applies on hotel Wi-Fi and at home. It needs software on every device and management of the agents.

**Data loss prevention (DLP)** looks for sensitive data leaving where it should not: card numbers (checked with the Luhn algorithm to cut false positives), national ID formats, documents carrying a "Confidential" label, or fingerprints of specific files. It runs on the network or proxy, on endpoints (USB copies, printing, uploads) and in cloud services, and it can log, warn the user, block, or encrypt. DLP sees only what it can read: encrypted archives and end-to-end encrypted channels defeat it unless it runs on the endpoint before encryption.

## Common mistakes

- Adding a deny rule below a broader allow, so it never matches.
- Leaving "any" in the service column of internal rules.
- Expecting an IDS connected to a SPAN port to block anything.
- Rate limiting only by address and calling password spraying solved.
- Deploying a WAF or DLP in "monitor" mode and never reviewing what it logs.

## Practice

1. In the policy table, which rule handles a connection from 10.10.5.9 to 10.20.0.30 on tcp/3389, and how do you fix it?
2. Change the nginx example to allow ten attempts per minute with no burst.
3. Write a Suricata rule that alerts on inbound TCP connections to port 3389 from outside the home network, with signature ID 1000004.
4. Sales staff work mostly from customer sites. Proxy or agent-based filtering?

### Answers

1. Rule 2 allows it. Move rule 3 above rule 2, and narrow rule 2 to the services staff need.
2. `limit_req_zone $binary_remote_addr zone=login:10m rate=10r/m;` and `limit_req zone=login;`
3. `alert tcp $EXTERNAL_NET any -> $HOME_NET 3389 (msg:"LOCAL Inbound RDP"; flow:to_server; flags:S; sid:1000004; rev:1;)`
4. Agent-based: their traffic rarely passes the office proxy.

## Key takeaways

- Rule order is policy: first match wins, so find shadowed and overly broad rules.
- Layer 4 trusts ports; layer 7 identifies applications and users.
- Rate limits blunt automated abuse at both layers; combine them with account controls.
- IDS detects, IPS blocks inline; NIDS, HIDS and WIPS watch the network, the host and the air.
- Proxies filter what passes them, agents filter everywhere; DLP finds sensitive data on the way out.

## Further reading

- [Suricata: Rules Format](https://docs.suricata.io/en/latest/rules/intro.html)
- [nftables manual page](https://www.netfilter.org/projects/nftables/manpage.html)
- [nginx: ngx_http_limit_req_module](https://nginx.org/en/docs/http/ngx_http_limit_req_module.html)
- [NIST SP 800-94: Guide to Intrusion Detection and Prevention Systems](https://csrc.nist.gov/pubs/sp/800/94/final)
