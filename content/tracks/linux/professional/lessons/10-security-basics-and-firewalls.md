---
title: Security Basics and Firewalls
summary: Reduce what can be attacked, audit setuid files, logins and open ports, keep packages patched, filter traffic with ufw or firewalld, and know what SELinux and AppArmor add.
minutes: 30
objectives:
  - Explain setuid, setgid and the sticky bit, and find every setuid or setgid file on a system
  - Audit who has logged in, which ports are open and which services run, and remove what is not needed
  - Configure a host firewall with `ufw` or `firewalld` without cutting off your own SSH session
  - Describe what mandatory access control (SELinux, AppArmor) adds to ordinary permissions
---

## Outline

1. Least privilege
2. Special permission bits
3. Who is here, and what is listening?
4. Updates
5. Host firewalls
6. SELinux and AppArmor

## Least privilege

The principle of **least privilege** says every person and program gets the access it needs
and nothing more. It shrinks the **attack surface**, everything an attacker could try, and it
limits the damage of a break-in: a compromised web server that runs as `www-data` cannot read
`/etc/shadow`; one that runs as root can do anything. This lesson applies that one idea to
files, logins, services, updates and network ports.

## Special permission bits

Besides read, write and execute, a mode has three special bits. Each has a real use and a real
risk.

- **setuid** (4000) on an executable: it runs with the **owner's** identity instead of the
  caller's. `passwd` is setuid root so that an ordinary user can update `/etc/shadow`.
- **setgid** (2000) on an executable runs it with the file's group. On a **directory** it makes
  new files inherit the directory's group, which is what a shared team directory needs.
- **sticky** (1000) on a directory: only a file's owner (or the directory's owner, or root) may
  delete or rename it, even if others can write to the directory. `/tmp` is the classic case.

`ls -l` shows them in the execute positions as `s` or `t`; a capital `S` or `T` means the
special bit is set without the execute bit underneath it, which is usually a mistake. In the
sandbox:

```bash
ls -l /usr/bin/passwd /usr/bin/chage; ls -ld /tmp
mkdir shared; chmod 2775 shared; chmod +t shared; ls -ld shared
touch f; chmod u+s f; ls -l f
```

```text
-rwxr-sr-x 1 root shadow 80376 Dec 14  2025 /usr/bin/chage
-rwsr-xr-x 1 root root   68248 Dec 14  2025 /usr/bin/passwd
drwxrwxrwt 1 root root 4096 Oct 14 11:17 /tmp
drwxrwsr-t 2 sandbox sandbox 4096 Oct 14 11:17 shared
-rwSr--r-- 1 sandbox sandbox 0 Oct 14 11:17 f
```

A setuid-root program with a bug gives root to whoever triggers it, and attackers who gain root
often leave a setuid copy of a shell behind as a back door. So administrators keep a list of
the setuid and setgid files and compare it over time. `-perm -4000` matches files with at least
that bit set, `-perm /6000` files with either bit:

```bash
find /usr/bin /usr/sbin -perm /6000 -type f -printf '%m %u:%g %p\n' | sort -k3 | head -n 5
```

```text
2755 root:shadow /usr/bin/chage
4755 root:root /usr/bin/chfn
4755 root:root /usr/bin/chsh
2755 root:shadow /usr/bin/expiry
4755 root:root /usr/bin/gpasswd
```

On a server search everything with `find / -xdev -perm /6000 -type f`, save the list, and
investigate anything new, especially in `/home`, `/tmp` or `/var`. Mounting those with `nosuid`
makes the bit ineffective there. Finally, the **umask** decides the
permissions of new files: the default `022` gives `644` files, and `027` keeps new files away
from other users.

## Who is here, and what is listening?

Logins leave traces. `who` lists the users logged in now and `w` adds what they are running;
`last` shows past logins and reboots from `/var/log/wtmp`; `sudo lastb` shows failed login
attempts; `lastlog` the most recent login of every account. An account that should be idle but
logged in last night deserves questions.

Every listening port is a door. Check them with `sudo ss -tlnup` on the machine; `sudo lsof -i
:25` names the process that holds one port; and `nmap` run from another machine shows what is
actually reachable through the network and firewalls, which is what an attacker sees. For each
service ask "do we need it?", and if not, remove the package or run `sudo systemctl disable --now
cups.service`. Remember the `.socket` unit if there is one, since socket activation can start the
service again on the next connection. Old systems filtered services started by `inetd` or
`xinetd` with **TCP wrappers** (`/etc/hosts.allow`, `/etc/hosts.deny`); few current services
honour those files, so use a firewall.

Limits protect a shared machine from one user or process: `ulimit -n` shows the open-file limit
of your shell, and `/etc/security/limits.conf` sets per-user limits such as `@students hard nproc
200`. Creating `/etc/nologin` blocks every login except root's, with the file's text shown as
the reason, which is useful during maintenance.

## Updates

Most break-ins use known holes that already have a fix. On Debian and Ubuntu, `sudo apt update`
refreshes the package lists and `sudo apt upgrade` installs the fixes; on Red Hat systems
`sudo dnf upgrade`. The `unattended-upgrades` package installs security updates automatically,
and `dnf-automatic` does the same on the Red Hat side. An update to a library or the kernel only
takes effect when the programs using it restart or the machine reboots: `needrestart` lists the
services still using old libraries, and a new kernel needs a reboot (or live patching). Schedule
those, rather than leaving an "updated" server running old code for months.

## Host firewalls

The Linux kernel filters packets with **netfilter**, configured today through **nftables**
(the `nft` command) and formerly through `iptables`. On a single server, a front end usually
writes those rules for you. Whichever you use, the safe policy is **deny incoming
by default, allow outgoing, and open only what you serve**. The danger is cutting off your own SSH
session, so allow SSH **before** you enable the firewall.

**ufw** (Uncomplicated Firewall) is common on Ubuntu and Debian. Rules are checked in order and
the first match wins. The sandbox has no firewall, so this is a typical server:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw limit 22/tcp
sudo ufw allow 443/tcp
sudo ufw allow proto tcp from 10.20.0.0/24 to any port 5432
sudo ufw enable
sudo ufw status numbered
```

```text
Status: active

     To                         Action      From
     --                         ------      ----
[ 1] 22/tcp                     LIMIT IN    Anywhere
[ 2] 443/tcp                    ALLOW IN    Anywhere
[ 3] 5432/tcp                   ALLOW IN    10.20.0.0/24
[ 4] 22/tcp (v6)                LIMIT IN    Anywhere (v6)
[ 5] 443/tcp (v6)               ALLOW IN    Anywhere (v6)
```

`limit` allows SSH but denies an address that opens six or more connections within thirty
seconds, a cheap brake on password guessing. Because the first match wins, an earlier
`ufw allow 22/tcp` would make the limit rule useless. `sudo ufw delete 2` removes a rule by number.

**firewalld** is the default on Red Hat family systems. It groups rules into **zones** (such as
`public` or `internal`) bound to interfaces or source addresses, and it keeps two
configurations: **runtime** (active now) and **permanent** (loaded at start and reload). A change
without `--permanent` is lost at the next reload; one with only `--permanent` does not apply
until a reload:

```bash
sudo firewall-cmd --get-active-zones
sudo firewall-cmd --permanent --zone=public --add-service=https
sudo firewall-cmd --permanent --zone=public --add-port=8443/tcp
sudo firewall-cmd --reload
sudo firewall-cmd --zone=public --list-all
```

A good habit is to test a change in runtime first and, once it works, save it with
`sudo firewall-cmd --runtime-to-permanent`.

## SELinux and AppArmor

Ordinary permissions are **discretionary**: the owner of a file decides who may use it, and root
may do anything. **Mandatory access control** adds rules from a system-wide policy that even
root's processes must obey, so a compromised service is confined to what its policy allows.
**SELinux** (Red Hat family) labels every file and process with a context and allows only the
interactions the policy lists; `getenforce` shows the mode (`Enforcing`, `Permissive`, which only
logs, or `Disabled`), `sestatus` gives details, `ls -Z` shows file labels, and denials are
logged to the audit log. **AppArmor** (Debian, Ubuntu, SUSE) confines programs by path-based
profiles; `sudo aa-status` lists profiles in enforce or complain mode. When a service fails with
"permission denied" although the file permissions look right, check these logs before blaming
anything else, and fix the label or profile rather than disabling the whole system.

## Common mistakes

- Enabling a firewall over SSH before allowing SSH.
- firewalld changes made without `--permanent`, which vanish at the next reload, or only with it and never reloaded.
- `chmod 4755` on a script or a copied binary to "make it work".
- Disabling a service but not its socket unit.
- Installing updates but never restarting services or rebooting into the new kernel.
- Turning SELinux or AppArmor off to fix one denial.

## Practice

1. A team shares `/srv/projects`. New files must belong to the group `projects`, and nobody may delete other people's files. Which mode do you set?
2. Write the `find` command that lists every setuid-root file on the root filesystem.
3. On a firewalld server you ran `firewall-cmd --add-port=9100/tcp`; it worked, but after a reboot the port is closed. Why, and what is the fix?

### Answers

1. `chgrp projects /srv/projects` and `chmod 3775 /srv/projects`: setgid (2000) for group
   inheritance, sticky (1000) so only owners delete, and `rwxrwxr-x` for the rest.
2. `find / -xdev -user root -perm -4000 -type f`.
3. The rule was added to the runtime configuration only. Run
   `firewall-cmd --permanent --add-port=9100/tcp` (or `--runtime-to-permanent` right after a
   working runtime change) and `firewall-cmd --reload`.

## Key takeaways

- Give each person and service only the access it needs; remove what nobody uses.
- setuid and setgid run with the file's identity; audit them with `find -perm /6000`.
- Know who logged in (`last`, `lastb`) and what listens (`ss -tlnup`, `nmap` from outside).
- Patch regularly, and restart or reboot so the fixes are actually running.
- Deny incoming by default with ufw or firewalld, allowing SSH first; MAC confines even root.

## Further reading

- [ufw(8) manual page (Ubuntu)](https://manpages.ubuntu.com/manpages/noble/man8/ufw.8.html)
- [firewalld: firewall-cmd](https://firewalld.org/documentation/man-pages/firewall-cmd.html)
- [lsof(8) manual page](https://man7.org/linux/man-pages/man8/lsof.8.html)
