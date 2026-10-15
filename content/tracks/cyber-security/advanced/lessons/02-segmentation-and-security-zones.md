---
title: Segmentation and Security Zones
summary: Divide a network physically and logically into security zones, write the policy between them, place firewalls, sensors and gateways where they work, shrink the attack surface, use diversity, and choose fail-open or fail-closed on purpose (SY0-801 objectives 3.1, 3.2 and 4.1).
minutes: 35
objectives:
  - Distinguish physical from logical segmentation and design security zones with a zone-to-zone policy
  - Place firewalls, IDS/IPS sensors, WAFs, load balancers, VPN gateways and jump hosts where each one is effective
  - Reduce attack surface, apply control diversity and choose fail-open or fail-closed behavior for each control
---

## Outline

1. Why segment
2. Physical and logical segmentation
3. Security zones and the policy between them
4. Device placement
5. Attack surface and diversity
6. Failure modes

## Why segment

On a **flat network** every device can reach every other one. One phished laptop can then scan the file servers, the database and the backup system. **Segmentation** divides the network into parts and controls the traffic between them, so a compromise in one part is contained and an attacker's **lateral movement** (moving from the first foothold to other systems) has to cross a control that can block and log it. It also limits audit scope: segmenting the systems that handle payment cards from the rest of the network can shrink a Payment Card Industry Data Security Standard (PCI DSS) assessment to that segment.

## Physical and logical segmentation

**Physical segmentation** uses separate hardware: separate switches, cables and firewalls for each part. Nothing is shared, so a switch misconfiguration cannot join two segments. It costs more and is harder to change. An air gap is its extreme form.

**Logical segmentation** divides shared hardware with configuration:

- **VLANs** (virtual LANs, IEEE 802.1Q) split one switch into separate layer 2 networks; traffic between VLANs must pass a router or firewall.
- **Subnets and access control lists (ACLs)** on routers decide which addresses may talk.
- **Cloud virtual networks and security groups** do the same in IaaS.
- **Microsegmentation** applies policy per workload, often with host firewalls or a hypervisor, so even two servers in one subnet cannot talk unless allowed.

Logical segmentation is only as good as its configuration. A trunk port that carries every VLAN to a printer, or a "temporary" allow-any rule, quietly re-flattens the network.

## Security zones and the policy between them

A **security zone** is a group of systems with the same trust level and the same security requirements. A typical small organization has:

```text
Zone    Holds                                     Trust
wan     the internet                              none
guest   visitor Wi-Fi                             none
dmz     public web servers, mail relay, reverse   low
        proxy (the screened subnet)
lan     staff laptops and phones                  medium
srv     internal applications and databases       high
mgmt    switch, firewall and server admin         highest
        interfaces, jump hosts
```

The **screened subnet** (still often called the DMZ, demilitarized zone) holds what the internet must reach, so a compromised web server sits in a zone that can reach only what it needs. Traffic between zones passes a firewall whose policy is written as "from zone, to zone, service, action", with **default deny**: anything not allowed is dropped. In nftables, on a firewall with one interface per zone, the forward chain looks like this (written from the nftables wiki syntax; the chain policy drops everything not accepted):

```text
table inet zones {
    chain forward {
        type filter hook forward priority filter; policy drop;
        ct state vmap { established : accept, related : accept, invalid : drop }

        iifname "lan0"  oifname "wan0" accept
        iifname "lan0"  oifname "dmz0" tcp dport 443 accept
        iifname "wan0"  oifname "dmz0" tcp dport 443 accept
        iifname "dmz0"  oifname "srv0" ip daddr 10.30.0.20 tcp dport 5432 accept
        iifname "mgmt0" tcp dport 22 accept
        iifname "guest0" oifname "wan0" accept
        iifname "lan0"  oifname "srv0" accept

        log prefix "zone-drop " counter drop
    }
}
```

`ct state` lets replies to allowed connections back in, so only the first packet of each connection needs a rule. Reading such a policy by eye is error-prone, so review it with a tool. Here the same policy is a table, and a short awk script answers "can this zone reach that port?" by the first-match rule:

```text
seq,from,to,port,action
10,lan,wan,any,allow
20,lan,dmz,443,allow
30,wan,dmz,443,allow
40,dmz,srv,5432,allow
50,mgmt,any,22,allow
60,guest,wan,any,allow
70,lan,srv,any,allow
```

```bash
#!/usr/bin/env bash
# reach.sh FROM TO PORT: the first matching rule wins; no match means deny.
awk -F, -v f="$1" -v t="$2" -v p="$3" '
NR == 1 { next }
($2 == f || $2 == "any") && ($3 == t || $3 == "any") && ($4 == p || $4 == "any") {
    printf "%-5s -> %s:%-5s %s (rule %s)\n", f, t, p, toupper($5), $1
    found = 1
    exit
}
END { if (!found) printf "%-5s -> %s:%-5s DENY (default)\n", f, t, p }
' zones.csv
```

```console
$ for q in "wan dmz 443" "wan srv 22" "guest srv 5432" "dmz srv 5432" "mgmt srv 22" "lan srv 22"; do bash reach.sh $q; done
wan   -> dmz:443   ALLOW (rule 30)
wan   -> srv:22    DENY (default)
guest -> srv:5432  DENY (default)
dmz   -> srv:5432  ALLOW (rule 40)
mgmt  -> srv:22    ALLOW (rule 50)
lan   -> srv:22    ALLOW (rule 70)
```

The last line is a finding. Rule 70 lets every staff laptop reach SSH on every server, so the management zone no longer guards administration. Replace it with the application ports the staff actually use.

## Device placement

Where a control sits decides what it can see and stop.

- **Firewalls** go at every zone boundary, including between internal zones, not only at the internet edge.
- A **web application firewall (WAF)** and a **load balancer** or reverse proxy sit in the screened subnet in front of the web servers, where they can inspect requests before the application does.
- A **network IDS** (intrusion detection system) sensor connects to a **SPAN port** (switch mirror port) or a **network tap** at a choke point, such as just inside the edge firewall, and sees copies of traffic. An **IPS** (intrusion prevention system) must be **inline**, in the traffic path, to block.
- The **VPN** gateway terminates at the edge and drops remote users into a zone of their own, not straight into `srv`.
- **Jump hosts** (bastion hosts) live in the management zone; admins connect to them first, with MFA, and only they may reach management interfaces.
- **Sensors** for OT networks are passive, because active probing can disturb controllers.

## Attack surface and diversity

The **attack surface** is everything an attacker could try: every reachable port, service, account, API and interface. Segmentation shrinks the surface each zone exposes; so do disabling unused services, removing default accounts and closing management interfaces to all but the management zone. Measure it from the attacker's position: a scan from the guest Wi-Fi shows what a visitor can reach.

**Diversity** means not relying on one technology or vendor for every layer. If the edge and internal firewalls come from different vendors, one vendor's vulnerability does not open both. The cost is complexity: two products, two skill sets, two update cycles. Use diversity where a single flaw would be catastrophic.

## Failure modes

Every control eventually fails: power, software crash, overload. Its **failure mode** is what it does then, and it must be chosen, not discovered.

- **Fail-closed** (fail-secure): the control blocks everything when it fails. Security is kept, availability is lost. A boundary firewall should fail closed; NIST SP 800-53 control SC-7(18) asks systems to "prevent systems from entering unsecure states" when a boundary protection device fails.
- **Fail-open**: traffic flows uninspected when the control fails. Availability is kept, protection is lost. An inline IPS on a hospital's clinical network often has a **bypass** module that fails open, because a stopped network could harm patients; the risk is accepted and compensated by monitoring.

Physical security has the same choice with different names: a **fail-safe** door lock opens on power loss so people can escape a fire, a **fail-secure** lock stays locked to protect a server room. Life safety always wins for doors on escape routes.

## Common mistakes

- Segmenting with VLANs but routing between them with no filtering, so the segments are cosmetic.
- Allowing the user zone to reach management ports "for convenience".
- Connecting an IDS sensor where it sees only encrypted or internal-only traffic, or expecting a SPAN-connected sensor to block.
- Leaving a device's failure mode at its default without a decision and a record.
- Putting the database in the screened subnet next to the web server.

## Practice

1. Using the table and the first-match rule above, what does `guest -> wan:443` return, and from which rule?
2. Rewrite rule 70 so staff reach only HTTPS (443) on the internal servers.
3. An inline IPS protects a stock trading platform where an hour of downtime costs more than most breaches. Which failure mode would the business likely choose, and what should compensate?
4. A web server, its database and the public DNS server must be placed. Which zone gets each?

### Answers

1. `guest -> wan:443  ALLOW (rule 60)`.
2. `70,lan,srv,443,allow`. SSH from staff laptops then falls through to the default deny.
3. Fail-open, to keep trading available, with alerting on the bypass, a redundant IPS pair and monitoring of the uninspected period.
4. Web server and public DNS in the screened subnet; the database in the internal server zone, reachable only from the web server on its database port.

## Key takeaways

- Segmentation contains compromises and forces lateral movement through a control.
- Physical segmentation shares nothing; logical segmentation (VLANs, ACLs, security groups, microsegmentation) depends on correct configuration.
- Zones group equal trust; the policy between them is default deny, read and tested by tools.
- Place each control where it sees the traffic: inline to block, mirrored to detect.
- Choose fail-open or fail-closed per control, from the business risk.

## Further reading

- [NIST SP 800-41 Rev. 1: Guidelines on Firewalls and Firewall Policy](https://csrc.nist.gov/pubs/sp/800/41/r1/final)
- [nftables wiki: Simple ruleset for a server](https://wiki.nftables.org/wiki-nftables/index.php/Simple_ruleset_for_a_server)
- [NIST SP 800-53 Rev. 5 (control SC-7, Boundary Protection)](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)
