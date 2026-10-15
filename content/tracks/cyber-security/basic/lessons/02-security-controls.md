---
title: Security Controls
summary: Sort any safeguard by category (technical, managerial, operational, physical) and by type (preventive, deterring, detective, corrective, compensating, directive), as SY0-801 objective 1.1 requires, using real configurations, logs and a small control register.
minutes: 30
objectives:
  - Name the four control categories and say which one a given control belongs to
  - Name the six control types and classify a control by what it does and when it acts
  - Choose a compensating control when the normal control cannot be applied
  - Use a control register to find gaps in an organization's coverage
---

## Outline

1. What a control is
2. The four categories: who or what carries it out
3. The six types: what it does and when
4. Classifying real controls
5. Compensating controls
6. Finding gaps with a control register

This lesson covers the control categories and control types of SY0-801 objective 1.1.

## What a control is

Lesson 1 defined a **security control** as any measure that reduces risk. Organizations run
hundreds of them, so they need a shared vocabulary to ask: do we have enough of each kind, and
does every important asset have a control that stops attacks, one that notices them and one that
recovers from them? Each control gets two labels: a **category** (how it is implemented) and a
**type** (what it achieves).

## The four categories

- **Technical** (also called **logical**) controls are carried out by hardware or software:
  firewalls, encryption, file permissions, multifactor authentication, antivirus.
- **Managerial** (also called **administrative**) controls govern the security program: policies,
  risk assessments, security plans, hiring rules, vendor reviews. They decide what should happen.
- **Operational** controls are carried out by people as part of daily work: a guard checking
  badges, an analyst reviewing logs, staff training, following the change process.
- **Physical** (also called **environmental**) controls act on the physical world: locks, fences,
  lighting, cameras, fire suppression, air conditioning for the server room.

A quick test: if a computer enforces it, it is technical; if it is a decision or a document, it
is managerial; if a person does it routinely, it is operational; if you could touch it, it is
physical.

## The six types

The type depends on the control's purpose and on when it acts relative to an incident:

- **Preventive** controls stop an incident before it happens: a firewall rule, a locked door,
  disabling an unused account.
- **Deterring** (deterrent) controls discourage an attacker without physically stopping them:
  warning signs, a login banner, visible cameras, the threat of disciplinary action.
- **Detective** controls identify and record an incident while or after it happens: logs and
  alerts, intrusion detection, motion sensors, a weekly access review.
- **Corrective** controls limit the damage and restore normal operation afterward: restoring from
  backup, an automatic service restart, reimaging an infected laptop, a fire extinguisher.
- **Compensating** controls are alternatives used when the normal control is not possible. NIST
  defines them as controls used in place of the baseline ones that provide equivalent or
  comparable protection.
- **Directive** controls tell people what to do: a policy, a standard, a procedure, a sign
  reading "Authorized personnel only". They work only if people follow them.

One control can have more than one type. A visible camera deters, and its recording detects.

## Classifying real controls

Here is part of the SSH server configuration (`/etc/ssh/sshd_config`) on a Debian server, with
the banner it points to:

```text
# /etc/ssh/sshd_config (excerpt)
PermitRootLogin no
PasswordAuthentication no
MaxAuthTries 3
Banner /etc/issue.net

# /etc/issue.net
Authorized use only. All activity on this system is logged and monitored.
```

The first three lines are **technical preventive** controls: they block logins as root, block
password guessing by accepting only keys, and cut off a connection after three failed attempts.
The banner is **technical deterring**: it stops nobody, but it tells everyone who connects that
the system is private and watched, which discourages casual misuse.

A **corrective** control from the same server, in a systemd unit file:

```ini
# /etc/systemd/system/booking.service (excerpt)
[Service]
ExecStart=/opt/booking/bin/booking-server
User=booking
Restart=on-failure
RestartSec=5
```

If the booking service crashes, systemd starts it again after five seconds, restoring
availability without a person. (The `User=booking` line is a preventive control: the service runs
without root rights.)

A **detective** control: the Linux audit system watches the `sudoers` file with the rule
`-w /etc/sudoers -p wa -k sudoers_change`, and an edit leaves this record:

```text
type=SYSCALL msg=audit(1792143611.512:4821): arch=c000003e syscall=257 success=yes exit=3 a0=ffffff9c a1=55d0c2a4b2a0 a2=241 a3=1b6 items=2 ppid=2310 pid=2318 auid=1001 uid=0 gid=0 euid=0 suid=0 fsuid=0 egid=0 sgid=0 fsgid=0 tty=pts0 ses=4 comm="vi" exe="/usr/bin/vim.basic" key="sudoers_change"
```

`uid=0` says the editor ran as root, but `auid=1001` (the audit user ID) is the account that
originally logged in, kept through `sudo`. The rule did not stop the edit; it recorded who made
it, which is exactly what a detective control does.

## Compensating controls

Sometimes the normal control cannot be used. A dental practice runs its X-ray machine from a PC
whose vendor supports only an old, unpatched operating system; patching (the normal preventive
control) would void the medical device's certification. Compensating controls give comparable
protection another way:

- put the PC on its own network segment and let a firewall allow only the imaging workstation to
  reach it;
- remove its internet access and disable USB storage;
- send its logs to the central server and alert on any new connection.

A compensating control must address the same risk and be documented with the reason the normal
control is not used, so that auditors and future administrators understand the exception.

## Finding gaps with a control register

Many organizations keep a **control register**: a list of controls with their category, type and
owner. Counting by type quickly shows what is missing. This is a small practice's register:

```text
category,type,control
technical,preventive,Firewall denies all inbound traffic except HTTPS to the booking site
technical,detective,Central log server alerts on five failed logins in a minute
technical,corrective,Nightly backups with a tested restore procedure
technical,deterrent,Login banner warns that use is monitored
physical,preventive,Badge reader on the server cupboard door
physical,detective,CCTV records the reception desk and server cupboard
physical,deterrent,"Alarmed premises" signs on every entrance
managerial,directive,Acceptable use policy signed by every employee
managerial,preventive,Background checks before staff get system access
operational,detective,Practice manager reviews the access log every Monday
operational,directive,New staff complete security awareness training in week one
```

```console
$ cut -d, -f2 controls.csv | tail -n +2 | sort | uniq -c
      1 corrective
      3 detective
      2 deterrent
      2 directive
      3 preventive
$ grep ',corrective,' controls.csv
technical,corrective,Nightly backups with a tested restore procedure
```

Only one corrective control exists. If a laptop is stolen or the server cupboard floods, nothing
in the register says how the practice recovers, so the next additions should be corrective:
remote wipe for laptops, an incident response procedure, a spare server or cloud restore target.

## Common mistakes

- **Classifying by the object, not the purpose.** A camera is physical, but whether it is
  deterring or detective depends on whether it is visible and whether anyone reviews the footage.
- **Calling every policy preventive.** A policy is managerial and directive; it prevents nothing
  unless a technical or operational control enforces it.
- **Detective controls nobody watches.** Alerts sent to an unread mailbox detect nothing in
  practice.
- **Undocumented compensating controls.** Without a written reason and scope, an exception
  becomes permanent and nobody remembers why the old PC is on the network.
- **Only preventive controls.** Prevention eventually fails; without detective and corrective
  controls, the organization neither notices nor recovers.

## Practice

1. Give the category and type of: (a) a fence topped with wire around a substation; (b) a data
   loss prevention tool that blocks email containing card numbers; (c) a quarterly review of who
   has administrator rights; (d) an "Employees must wear badges" sign.
2. A web application cannot have multifactor authentication added until next year. Suggest two
   compensating controls.
3. In the audit record above, which field would you use to prove which person edited `sudoers`,
   and why not `uid`?
4. Add one corrective control of each category except managerial to the practice's register.

### Answers

1. (a) Physical, preventive (and deterring). (b) Technical, preventive. (c) Operational (a person
   performs it routinely), detective. (d) Physical, directive.
2. For example: allow sign-in only from the company VPN or office addresses; alert on logins from
   new locations; shorten session lifetimes; require a second approval for risky actions.
3. `auid`, the login user ID, which `sudo` does not change. `uid=0` only says root ran the
   editor, which is true for every administrator.
4. Technical: remote wipe for laptops. Operational: an on-call technician restores service from
   backup following the recovery procedure. Physical: a fire extinguisher or a spare power supply.

## Key takeaways

- Categories describe how a control is implemented: technical (logical), managerial
  (administrative), operational, physical (environmental).
- Types describe what it does: preventive, deterring, detective, corrective, compensating,
  directive. One control can have several types.
- Compensating controls replace an infeasible control with comparable protection and must be
  documented.
- A control register counted by type reveals gaps, often missing detective or corrective
  controls.

## Further reading

- [NIST SP 800-53 Rev. 5, Security and Privacy Controls for Information Systems and Organizations](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)
- [NIST CSRC glossary: compensating controls](https://csrc.nist.gov/glossary/term/compensating_controls)
- [sshd_config(5) manual page](https://man.openbsd.org/sshd_config)
- [systemd.service(5) manual page: Restart=](https://man7.org/linux/man-pages/man5/systemd.service.5.html)
