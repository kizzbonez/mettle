---
title: Zero Trust Architecture and Secure Access
summary: Build Zero Trust as NIST SP 800-207 describes it (policy engine, administrator and enforcement points deciding per session from user authentication, device health and inventory, and application entitlements), and secure remote access with VPNs, tunnels, out-of-band management, safe file transfer, end-to-end encrypted messaging and Security Service Edge (SY0-801 objective 3.2).
minutes: 35
objectives:
  - Explain the NIST SP 800-207 components (PE, PA, PEP) and how a per-session access decision uses identity, device health and inventory, and entitlements
  - Choose between remote-access VPN, site-to-site VPN, split and full tunnels, SSH tunnels and ZTNA for a scenario
  - Secure administration and data exchange with out-of-band management, SFTP or FTPS, and end-to-end encrypted messaging
  - Describe what Security Service Edge bundles (SWG, CASB, ZTNA) and how it differs from SASE
---

## Outline

1. From perimeter to Zero Trust
2. The NIST SP 800-207 components
3. A per-session decision
4. VPNs and tunnels
5. Out-of-band management and file transfer
6. End-to-end encrypted messaging
7. Security Service Edge

## From perimeter to Zero Trust

The perimeter model trusts whatever is inside the firewall. Once an attacker is inside (a phished laptop, a stolen VPN password) the network trusts them too. **Zero Trust** removes trust based on network location. NIST SP 800-207 states its tenets; in short:

1. All data sources and computing services are resources.
2. All communication is secured regardless of network location.
3. Access is granted per session, with least privilege.
4. Access is decided by dynamic policy: the identity of the client, the application, the state of the requesting device, and behavioral and environmental attributes.
5. The enterprise monitors the integrity and security posture of all its assets; no asset is inherently trusted.
6. Authentication and authorization are dynamic and strictly enforced before access is allowed.
7. The enterprise collects as much information as it can about assets, network and communications and uses it to improve its security posture.

Zero Trust is a set of principles applied through an architecture, not a product you buy.

## The NIST SP 800-207 components

- The **policy engine (PE)** makes "the ultimate decision to grant access to a resource for a given subject", using enterprise policy and outside inputs.
- The **policy administrator (PA)** carries the decision out: it opens or shuts the communication path and issues session credentials. The PE and PA together are the **policy decision point (PDP)**.
- The **policy enforcement point (PEP)** sits in the path, enables, monitors and terminates the connection. It can be an agent on the laptop plus a gateway in front of the application.

The PE and PA live on the **control plane**; the application traffic flows on the **data plane** through the PEP. The PE's inputs include a **continuous diagnostics and mitigation (CDM)** system that reports each device's patch level and software, threat intelligence, activity logs, the identity system and the enterprise PKI.

## A per-session decision

Security+ lists three things a Zero Trust architecture checks. **User authentication**: who is asking, verified with MFA, ideally phishing-resistant. **Device management**: is the device in the **inventory** of known, managed assets, and is its **health** acceptable (patched, endpoint protection running, disk encrypted)? **Application access control**: is this user entitled to this application, and only this one? This toy policy engine applies all three for each request:

```python
INVENTORY = {  # from the device management system (CDM)
    "LT-0412": {"owner": "amara", "patched": True, "edr": True, "disk_encrypted": True},
    "LT-0388": {"owner": "jonas", "patched": False, "edr": True, "disk_encrypted": True},
}
ENTITLEMENTS = {"amara": {"payroll", "wiki"}, "jonas": {"wiki"}}


def decide(request):
    """Return (decision, reason) for one access request."""
    user, device, app = request["user"], request["device"], request["app"]
    if not request["mfa"]:
        return "deny", "user not authenticated with MFA"
    if device not in INVENTORY:
        return "deny", f"device {device} not in inventory"
    health = INVENTORY[device]
    failed = [check for check, ok in health.items() if check != "owner" and not ok]
    if failed:
        return "deny", f"device unhealthy: {', '.join(failed)}"
    if app not in ENTITLEMENTS.get(user, set()):
        return "deny", f"{user} not entitled to {app}"
    return "allow", "session for this app only"
```

The script then calls `decide()` for five requests and prints one line per decision (decision, user, device, application, reason):

```text
allow amara  LT-0412  payroll  session for this app only
deny  amara  HOME-PC  payroll  device HOME-PC not in inventory
deny  jonas  LT-0388  wiki     device unhealthy: patched
deny  jonas  LT-0412  payroll  jonas not entitled to payroll
deny  amara  LT-0412  wiki     user not authenticated with MFA
```

The right user on an unknown home PC is refused; the right user on a known but unpatched laptop is refused; a valid user and device without the entitlement is refused. In a real deployment the decision is re-evaluated during the session, so a laptop whose EDR agent stops loses access without waiting for the next login.

## VPNs and tunnels

**Tunneling** wraps one protocol's packets inside another's. A **virtual private network (VPN)** is an encrypted tunnel across an untrusted network.

- **Site-to-site VPN** joins two networks, usually with IPsec (Internet Protocol Security). IPsec **tunnel mode** encrypts the whole original packet and adds a new header; **transport mode** protects only the payload between two hosts.
- **Remote-access VPN** connects one user's device, with IPsec (IKEv2), a TLS VPN or WireGuard.
- A **full tunnel** sends all the device's traffic through the VPN, so the organization's filtering applies; a **split tunnel** sends only corporate subnets through it, saving bandwidth but leaving internet traffic uninspected.

A WireGuard client configuration (`wg-quick` format) shows the split decision in one line, `AllowedIPs`:

```ini
[Interface]
PrivateKey = <client private key>
Address = 10.8.0.14/32
DNS = 10.30.0.53

[Peer]
PublicKey = <gateway public key>
Endpoint = vpn.example.net:51820
# split tunnel: only the internal ranges; 0.0.0.0/0, ::/0 would be a full tunnel
AllowedIPs = 10.30.0.0/16, 10.40.0.0/16
PersistentKeepalive = 25
```

A traditional VPN gives a connected user a route to whole subnets, which is the opposite of per-application access. **Zero Trust network access (ZTNA)** replaces it with a broker that connects a verified user and device to one application at a time.

**SSH** can tunnel too. An administrator reaches a database that listens only inside the server zone through the jump host, and nothing but SSH crosses the firewall:

```console
$ ssh -J ops@jump.mgmt.example.net -L 5432:db.srv.internal:5432 ops@app01.srv.internal
```

`-J` (ProxyJump) hops through the bastion host; `-L` forwards local port 5432 through the tunnel to the database. **Remote desktop** (RDP) belongs behind such a gateway or ZTNA broker with MFA, never exposed directly to the internet.

Any remote path is only as safe as the accounts behind it. **User management** creates remote-access accounts from approved requests and removes them the day they are no longer needed (lesson 7 covers the life cycle), and **user access** follows **least privilege**: each user reaches only the applications and hosts their role needs, not "the VPN".

## Out-of-band management and file transfer

**Out-of-band management** reaches devices through a separate path from production traffic: a dedicated management network, console servers attached to serial ports, or a cellular modem. It works when the production network is down or under attack, and it keeps management interfaces such as server baseboard management controllers (BMCs) off the user network. Protect it as the most privileged zone you have.

**File transfer** must be encrypted and authenticated. FTP and TFTP send passwords and files in clear text. Use **SFTP** (file transfer over SSH), **FTPS** (FTP over TLS), HTTPS, or a managed file transfer service that adds logging and approvals, and publish a hash so recipients can verify integrity.

## End-to-end encrypted messaging

**End-to-end encryption (E2EE)** means only the communicating devices hold the keys, so the service provider relays messages it cannot read. The Signal protocol and the IETF's Messaging Layer Security (MLS, RFC 9420) do this. E2EE protects against a breached server, but it also blinds the organization's own DLP and archiving, which some regulations require; choose an enterprise messaging product that meets retention rules.

## Security Service Edge

**Security Service Edge (SSE)** is an analyst term (Gartner, 2021) for security controls delivered from the cloud, close to wherever users are. It usually bundles a **secure web gateway (SWG)** that filters web traffic, a **cloud access security broker (CASB)** that sees and controls SaaS use, and **ZTNA** for private applications, often with firewall as a service and DLP. **Secure Access Service Edge (SASE)** is SSE plus SD-WAN (software-defined wide area networking), joining the network and security halves.

## Common mistakes

- Calling a product "Zero Trust" while users still get flat network access after login.
- Checking the device only at login, not during the session.
- Split tunneling by default for users who handle sensitive data, so their web traffic bypasses inspection.
- Exposing RDP or a BMC web interface to the internet "temporarily".
- Moving files with FTP because "it is only inside the network".

## Practice

1. Which SP 800-207 component terminates the connection when the PE revokes access?
2. Rewrite the WireGuard `AllowedIPs` line as a full tunnel.
3. A contractor needs one internal web application for three months from an unmanaged laptop. VPN or ZTNA, and why?
4. Add a rule to `decide()` that denies requests from devices whose `owner` is not the requesting user.

### Answers

1. The PEP, instructed by the PA.
2. `AllowedIPs = 0.0.0.0/0, ::/0`.
3. ZTNA: it connects the contractor to that one application, and policy can apply limits for an unmanaged device (browser-only access, no downloads). A VPN would route the laptop onto internal subnets.
4. After the health check:

   ```python
   if health["owner"] != user:
       return "deny", f"{device} is assigned to {health['owner']}"
   ```

## Key takeaways

- Zero Trust removes trust based on location; every session is decided from identity, device state and entitlement.
- The PE decides, the PA executes, the PEP enforces; device health comes from continuous diagnostics.
- VPNs encrypt tunnels; full versus split tunnel trades inspection for bandwidth; ZTNA narrows access to one application.
- Out-of-band management and encrypted file transfer keep administration and data exchange off the attack path.
- SSE delivers SWG, CASB and ZTNA from the cloud; SASE adds SD-WAN.

## Further reading

- [NIST SP 800-207: Zero Trust Architecture](https://csrc.nist.gov/pubs/sp/800/207/final)
- [CISA Zero Trust Maturity Model](https://www.cisa.gov/zero-trust-maturity-model)
- [WireGuard: Quick Start](https://www.wireguard.com/quickstart/)
- [RFC 9420: The Messaging Layer Security (MLS) Protocol](https://www.rfc-editor.org/rfc/rfc9420.html)
