---
title: Zero Trust and Least Privilege
summary: Why "inside the network" no longer means trusted. Learn the Zero Trust principles of NIST SP 800-207 (never trust, always verify; verify explicitly; assume breach), least privilege for people, services and cloud roles, and how both replace perimeter thinking (SY0-801 objective 1.1).
minutes: 30
objectives:
  - Explain the perimeter model, implicit trust zones and lateral movement
  - State the Zero Trust principles and apply them to an access request
  - Apply least privilege to a user, a service and a cloud permission policy
  - Contrast Zero Trust decisions with perimeter-based decisions in a scenario
---

## Outline

1. The perimeter model and where it fails
2. Zero Trust principles
3. An access decision, step by step
4. Least privilege
5. What changes in practice

This lesson covers the Zero Trust principles and least privilege bullets of SY0-801 objective
1.1. The components of a Zero Trust architecture (policy engines, enforcement points) come in
the advanced level.

## The perimeter model and where it fails

For decades, networks were built like a castle with a moat. A firewall at the edge kept the
internet out, and anything inside the office network, or connected to it by a VPN (virtual
private network), was trusted. NIST calls such an area an **implicit trust zone**: once past the
gate, every person and device in it is trusted as much as the gate's last check.

Two things broke this model. First, the edge dissolved: staff work from home, data lives in cloud
services, and personal phones read company email. Second, attackers learned that one foothold
inside is enough. A phished laptop or a vulnerable printer gives them a trusted position, and
from there they move from system to system, which is called **lateral movement**. NIST SP 800-207
calls unauthorized lateral movement one of the biggest challenges for federal agencies, because
perimeter firewalls do little against attacks that start inside the network.

## Zero Trust principles

**Zero Trust** (ZT) is a security model in which trust is never granted implicitly but must be
continually evaluated. NIST SP 800-207 puts the core idea this way: no implicit trust is granted
to users or devices based solely on their network location or on who owns the device. Its tenets
reduce to a few principles, usually summarized as:

- **Never trust, always verify.** Every request is treated as untrusted until checked, whether it
  comes from the office, a home network or a hotel.
- **Verify explicitly.** Each decision uses all available signals: who the user is and how
  strongly they authenticated (for example, with multifactor authentication, MFA), the device and
  its health (managed, patched, encrypted), the resource and its sensitivity, and context such as
  time and behavior.
- **Least privilege.** Grant only the access needed for this task, ideally per session, so that
  access to one resource does not grant access to another.
- **Assume breach.** Design as if an attacker is already inside: authenticate and encrypt all
  traffic, even on the internal network, divide systems so a compromise stays small, and monitor
  everything.

SP 800-207 adds that access policy is **dynamic** (it reacts to the current state of the user and
device) and that the organization continuously collects information about its assets to improve
those decisions. CISA's (the Cybersecurity and Infrastructure Security Agency's) Zero Trust
Maturity Model groups the work into five pillars: identity, devices, networks, applications and
workloads, and data.

## An access decision, step by step

This small Python function shows the shape of a Zero Trust decision for a clinic's systems. It
checks identity, device health and entitlement for every request, denies by default, and never
looks at the network field:

```python
ENTITLEMENTS = {"maria": {"patient-records", "rota"}, "tom": {"rota"}}
HEALTHY_DEVICES = {"laptop-14", "tablet-03"}  # managed, patched, disk encrypted


def decide(request):
    """Evaluate one request on its own; the network it came from is never consulted."""
    if not request["mfa_passed"]:
        return "deny (identity not verified)"
    if request["device"] not in HEALTHY_DEVICES:
        return "deny (device not compliant)"
    if request["resource"] not in ENTITLEMENTS.get(request["user"], set()):
        return "deny (not entitled)"
    return "allow"
```

Running it on five requests:

```text
maria  laptop-14  office      patient-records  allow
maria  home-pc    office      patient-records  deny (device not compliant)
tom    tablet-03  hotel-wifi  rota             allow
tom    tablet-03  hotel-wifi  patient-records  deny (not entitled)
tom    tablet-03  office      rota             deny (identity not verified)
```

The second line is the important one. A perimeter firewall would have trusted Maria's unmanaged
home PC because it was plugged in at the office; the Zero Trust check refused it. The third line
shows the opposite: Tom on hotel Wi-Fi is allowed, because his identity and device passed and he
is entitled to the rota.

## Least privilege

The principle of **least privilege** says that every user, and every process acting for a user,
gets only the access needed to do assigned tasks, and nothing more (NIST SP 800-53, control
AC-6). It limits what a mistake or a stolen account can do. Apply it at every level.

**People.** Give staff the permissions of their role, not of the most senior person who might
need them. Administrators get a separate administrative account used only for administration, so
their everyday account, the one that reads email and browses the web, has no special rights.
Related ideas: **need to know** (access to data only when the task requires it) and **privilege
creep**, the slow build-up of rights as people change jobs and keep old access.

**Services and automation.** A deployment script needs to restart one service, not to be root.
On Linux, `sudo` can grant exactly that one command. This is the rule and what the account sees
on a Debian 12 server:

```text
# /etc/sudoers.d/deploy
deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart booking.service
```

```console
$ sudo -l
Matching Defaults entries for deploy on web01:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin, use_pty

User deploy may run the following commands on web01:
    (root) NOPASSWD: /usr/bin/systemctl restart booking.service
```

If the deployment key is stolen, the attacker can restart the booking service and do nothing
else as root.

**Cloud permissions.** Cloud providers express permissions as policies. This AWS (Amazon Web
Services) identity policy lets a billing job read one folder of one storage bucket:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadBillingExports",
      "Effect": "Allow",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::clinic-exports/billing/*"
    }
  ]
}
```

The over-privileged version, `"Action": "s3:*"` with `"Resource": "*"`, would let the same job
read, overwrite and delete every bucket in the account, so one leaked credential would expose
everything.

## What changes in practice

| Question | Perimeter thinking | Zero Trust thinking |
| --- | --- | --- |
| Where is trust decided? | Once, at the network edge | At every request, close to the resource |
| Does the office network help? | Yes, inside means trusted | No, location alone grants nothing |
| What about internal traffic? | Often unencrypted | Authenticated and encrypted |
| How long does access last? | Until the session or VPN ends | Per session, re-evaluated on change |
| What if an attacker gets in? | Free lateral movement | Contained by segmentation and least privilege |

Zero Trust is not a product you buy. It is a direction: organizations move toward it over years
by strengthening identity, managing devices, dividing networks and tightening permissions.

## Common mistakes

- **Calling a VPN "Zero Trust".** A VPN that drops users onto the whole internal network is the
  perimeter model with a longer cable.
- **Verifying once at login and never again.** If a device falls out of compliance or the user
  suddenly downloads thousands of records, the decision should be revisited.
- **Wildcard permissions.** `"Action": "*"` or `ALL=(ALL) ALL` in sudoers "to make it work"
  grants far more than the task needs.
- **Daily work in an administrator account.** One malicious attachment then runs with full
  rights.
- **Never removing access.** Without periodic access reviews, privilege creep quietly undoes least
  privilege.

## Practice

1. An attacker phishes a receptionist, then reaches the finance server from the receptionist's
   PC. Name this movement, and two Zero Trust principles that would have limited it.
2. In the Python example, what would a perimeter rule ("allow everything from `office`") have
   decided for the five requests?
3. Write a sudoers line that lets the `backup` account run only `/usr/bin/rsync` as root.
4. A monitoring service needs to read CPU metrics from 40 servers. Its account currently belongs
   to the Domain Admins group. What is wrong, and what should it have instead?

### Answers

1. Lateral movement. Assume breach (segment systems and authenticate internal traffic) and
   verify explicitly with least privilege (the receptionist's identity and device should not be
   entitled to the finance server).
2. Requests 1, 2 and 5 would be allowed (including the unmanaged home PC and the failed MFA), and
   requests 3 and 4 from the hotel would be denied, including Tom's legitimate rota access.
3. `backup ALL=(root) /usr/bin/rsync`. Better still, pin the arguments the job needs.
4. It violates least privilege: a stolen monitoring credential would control the whole domain.
   Give it a dedicated service account with read-only access to the metrics on those servers.

## Key takeaways

- Perimeter security trusts everything inside an implicit trust zone, which enables lateral
  movement once an attacker gets in.
- Zero Trust: never trust, always verify; verify explicitly with identity, device and context;
  least privilege per session; assume breach.
- Least privilege applies to people, services and cloud roles; separate admin accounts and review
  access to stop privilege creep.
- Network location alone never grants access in a Zero Trust design.

## Further reading

- [NIST SP 800-207, Zero Trust Architecture](https://csrc.nist.gov/pubs/sp/800/207/final)
- [CISA Zero Trust Maturity Model](https://www.cisa.gov/zero-trust-maturity-model)
- [Microsoft Learn: Zero Trust principles](https://learn.microsoft.com/en-us/security/zero-trust/zero-trust-overview)
- [sudoers(5) manual](https://www.sudo.ws/docs/man/sudoers.man/)
