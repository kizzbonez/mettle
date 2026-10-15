---
title: Endpoint and OS Hardening
summary: Harden systems against a secure baseline and check it with a script, restrict sudo and containers, sandbox untrusted code, control which applications run, compare antivirus, EDR and XDR, manage mobile devices, admit devices with 802.1X and posture checks, and apply Group Policy and SELinux (SY0-801 objective 4.1).
minutes: 40
objectives:
  - Apply and verify a secure configuration baseline, including least-privilege sudo rules and hardened container settings
  - Compare application allow lists and block lists, and antivirus, EDR and XDR
  - Explain MDM, 802.1X, posture checks and captive portals as ways to admit only compliant devices
  - Read an SELinux denial and fix it without disabling SELinux, and describe how Group Policy applies settings
---

## Outline

1. Baselines and hardening
2. Least privilege on the host: sudo and containers
3. Sandboxing and application control
4. Antivirus, EDR and XDR
5. MDM and network access control
6. Group Policy and SELinux

## Baselines and hardening

**Hardening** reduces what can go wrong on a system: remove software and services you do not need, change default passwords and settings, close ports, turn on logging, patch. A **secure baseline** writes the hardened configuration down so every system can be built to it and checked against it. You rarely write one from scratch: the **CIS Benchmarks**, the US Defense Information Systems Agency's STIGs (Security Technical Implementation Guides) and vendor baselines such as Microsoft's security baselines list each setting with its rationale.

A baseline is only useful if it is checked, because settings drift. This script checks four OpenSSH server settings. It follows two rules from the `sshd_config` manual: for a keyword that appears more than once, "the first obtained value will be used", and a missing keyword takes its default (`PasswordAuthentication` defaults to `yes`):

```bash
#!/usr/bin/env bash
# check-sshd.sh FILE: compare the effective value of each setting with the baseline.
# sshd uses the FIRST value it reads for a keyword; a missing keyword takes the default.
declare -A want=([permitrootlogin]=no [passwordauthentication]=no [x11forwarding]=no [maxauthtries]=4)
declare -A default=([permitrootlogin]=prohibit-password [passwordauthentication]=yes
                    [x11forwarding]=no [maxauthtries]=6)
fails=0
for key in permitrootlogin passwordauthentication x11forwarding maxauthtries; do
  value=$(awk -v k="$key" 'tolower($1) == k { print tolower($2); exit }' "$1")
  source="file"
  if [ -z "$value" ]; then value=${default[$key]}; source="default"; fi
  if [ "$key" = maxauthtries ]; then ok=$(( value <= want[$key] )); else ok=$([ "$value" = "${want[$key]}" ] && echo 1 || echo 0); fi
  if [ "$ok" = 1 ]; then status=PASS; else status=FAIL; fails=$((fails + 1)); fi
  printf '%s %-24s %-18s (%s; baseline %s)\n' "$status" "$key" "$value" "$source" "${want[$key]}"
done
exit $(( fails > 0 ))
```

The server's file has `PermitRootLogin yes` near the top and a colleague's `PermitRootLogin no` added at the end:

```console
$ bash check-sshd.sh sshd_config; echo "exit status $?"
FAIL permitrootlogin          yes                (file; baseline no)
FAIL passwordauthentication   yes                (default; baseline no)
FAIL x11forwarding            yes                (file; baseline no)
PASS maxauthtries             3                  (file; baseline 4)
exit status 1
```

The appended line never took effect, and the missing `PasswordAuthentication` line means passwords are allowed. A real check also reads the files pulled in by `Include` lines, which come first and therefore win. Configuration management tools (Ansible, Group Policy, MDM) enforce baselines continuously instead of checking once.

## Least privilege on the host: sudo and containers

`sudo` lets a user run commands as root. A rule granting `ALL` makes the user root. Grant named commands with fixed arguments instead:

```text
# /etc/sudoers.d/webops   (edit with: visudo -f /etc/sudoers.d/webops)
Defaults use_pty
Defaults logfile=/var/log/sudo.log
%webops ALL=(root) /usr/bin/systemctl restart nginx.service, /usr/bin/journalctl -u nginx.service
```

Members of `webops` may restart nginx and read its journal, nothing else. Never grant an editor, a pager or a shell this way: `sudo vi` can start a root shell from inside the editor. To let someone edit a root-owned file, grant `sudoedit`, which edits a copy as the user.

Containers need the same discipline. A hardened Docker Compose service runs as a non-root user, with a read-only file system, every Linux capability dropped, no privilege escalation, a process limit, and its port published only on the loopback interface:

```yaml
services:
  api:
    image: registry.example.net/clinic/api:2.4.1
    user: "10001:10001"
    read_only: true
    tmpfs: [/tmp]
    cap_drop: [ALL]
    security_opt: ["no-new-privileges:true"]
    pids_limit: 200
    ports: ["127.0.0.1:8080:8080"]
```

The Compose documentation warns that a port published without a host IP binds to all interfaces "bypassing host firewall rules". Never set `privileged: true`, which gives the container nearly all the host's power, and never mount `/var/run/docker.sock` into a container, which hands it control of the Docker daemon.

## Sandboxing and application control

**Sandboxing** runs code in an isolated environment with limited access to the rest of the system: browser tabs in sandboxed processes, containers with seccomp filters, a disposable Windows Sandbox, or a malware analysis sandbox that detonates suspicious attachments and records what they do.

**Application control** decides which programs may run. An **allow list** (Microsoft App Control for Business or AppLocker, by publisher, path or hash) permits only approved software: very strong, and work to maintain. A **block list** forbids known-bad programs and permits everything else: easy, but blind to anything new. High-risk systems such as kiosks, OT workstations and domain controllers are where allow lists pay off.

## Antivirus, EDR and XDR

**Antivirus** matches files against signatures and heuristics and quarantines what matches. **Endpoint detection and response (EDR)** records process, file, registry and network activity on each endpoint, detects malicious behavior (an Office document starting PowerShell, for example) and lets responders isolate the host, kill the process and investigate the timeline remotely. **Extended detection and response (XDR)** correlates that endpoint data with email, identity, network and cloud signals, so one incident appears as one story instead of five unrelated alerts.

## MDM and network access control

**Mobile device management (MDM)** enrolls phones, tablets and laptops and enforces policy on them: passcodes, encryption, OS versions, approved apps, and remote lock or wipe when a device is lost. On personal devices (BYOD, bring your own device) it usually manages a separate work profile, so the organization can wipe its data without touching the owner's photos. MDM compliance status is a common device-health input to Zero Trust decisions.

**Network access control (NAC)** decides whether a device may join the network at all. **IEEE 802.1X** does it at the switch port or Wi-Fi access point: the device (the **supplicant**) presents credentials, ideally a certificate with EAP-TLS, to the switch (the **authenticator**), which asks a RADIUS **authentication server**; until it says yes, the port passes nothing but authentication traffic. **Posture** or compliance checks then test the device, with a permanent or dissolvable agent or agentless, and send a non-compliant one to a quarantine VLAN to be patched. **Captive portals** (the hotel Wi-Fi login page) collect acceptance of terms or a guest code; they are suitable for guest networks, not as strong authentication.

## Group Policy and SELinux

**Group Policy** manages Windows settings centrally. Group Policy Objects (GPOs) are linked to sites, domains and organizational units (OUs) in Active Directory and applied at startup, sign-in and periodic refresh, in the order local, site, domain, OU, so the GPO closest to the object wins a conflict unless a higher one is enforced. `gpupdate /force` applies changes now; `gpresult /r` shows which GPOs applied.

**SELinux** (Security-Enhanced Linux) is mandatory access control: every process and file has a **context** `user:role:type:level`, and the policy says which process types may touch which file types, even for root. When a web server cannot read content that ordinary permissions allow, the audit log explains:

```text
type=AVC msg=audit(1791625221.512:412): avc:  denied  { read } for  pid=2841 comm="httpd" name="index.html" dev="dm-0" ino=1311 scontext=system_u:system_r:httpd_t:s0 tcontext=unconfined_u:object_r:user_home_t:s0 tclass=file permissive=0
```

The `httpd_t` process was denied reading a file labeled `user_home_t`: the site was copied from a home directory and kept its label. Fix the label, not the policy:

```console
# semanage fcontext -a -t httpd_sys_content_t "/srv/clinic(/.*)?"
# restorecon -R -v /srv/clinic
```

`semanage` records the rule and `restorecon` applies it. Behavior switches are **booleans**, such as `setsebool -P httpd_can_network_connect_db on`. `getenforce` should say `Enforcing`; `Permissive` only logs.

## Common mistakes

- Appending a hardening line to a config file whose earlier line wins.
- `ALL` or an editor in a sudo rule.
- `privileged: true` or a published port without `127.0.0.1` "just for testing".
- Running SELinux in permissive mode, or disabling it, to fix one denial.
- Treating a captive portal as network authentication.

## Practice

1. Fix the `sshd_config` above so all four checks pass.
2. Is `%helpdesk ALL=(root) /usr/bin/less /var/log/*` safe?
3. A laptop passes 802.1X but its antivirus is three months out of date. What should NAC do?
4. A file under `/srv/clinic` was restored from a backup and httpd cannot read it. Which command fixes it?

### Answers

1. Remove the early `PermitRootLogin yes` and `X11Forwarding yes` lines (or change them to `no`) and add `PasswordAuthentication no`, checking the included files too.
2. No: `less` can run shell commands (`!sh`), and sudoers matches the arguments as one string, so `*` also matches `/var/log/../../etc/shadow` or a second file name. Grant `journalctl` for specific units, or add the staff to a group that may read the logs.
3. Fail the posture check and place it in a quarantine VLAN with access only to update servers.
4. `restorecon -R -v /srv/clinic`, since the file-context rule already exists.

## Key takeaways

- Build to a published baseline and check it automatically; know how the software reads its config.
- Least privilege applies to sudo rules and containers: named commands, non-root users, no privileged mode.
- Allow lists beat block lists where they can be maintained; EDR and XDR add behavior and response.
- MDM, 802.1X and posture checks admit only managed, compliant devices.
- Group Policy and SELinux enforce settings centrally; fix SELinux labels instead of disabling it.

## Further reading

- [sshd_config(5) manual page](https://man.openbsd.org/sshd_config)
- [Red Hat: Troubleshooting problems related to SELinux](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/using_selinux/troubleshooting-problems-related-to-selinux_using-selinux)
- [Docker Compose: services reference](https://docs.docker.com/reference/compose-file/services/)
- [Microsoft: Group Policy overview](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/group-policy/group-policy-overview)
