---
title: Change Management
summary: How a controlled change process protects security and availability (SY0-801 objective 1.2). Follow one real change from request to approval, implementation and backout, covering the CAB, ownership, stakeholders, impact analysis, testing, maintenance windows, SOPs, technical implications, documentation and version control.
minutes: 30
objectives:
  - Describe the business steps of a change, from request through CAB approval to review
  - Identify technical implications of a change such as restarts, downtime, allow lists, legacy applications and dependencies
  - Write a backout plan and decide when to fail forward instead
  - Use version control and documentation updates to keep changes traceable
---

## Outline

1. Why change management is a security control
2. The business process
3. Technical implications
4. Version control and documentation
5. A change that had to be backed out

This lesson covers SY0-801 objective 1.2: "Given a scenario, demonstrate the impact of change
management processes on security."

## Why change management is a security control

Most outages, and many security incidents, start with a change: a firewall rule opened "just for
today", a patch that broke an old application, a certificate replaced on one server but not its
twin. **Change management** is the process that decides which changes are made, when, by whom and
with what safety net. NIST SP 800-53 makes it a control (CM-3, configuration change control):
document the change, analyze its security impact (CM-4), approve or reject it, test it, keep a
record, and review what happened. An unauthorized change is itself a warning sign, because
attackers change systems too.

## The business process

Follow change **CHG-2041** at a regional clinic group: the patient portal still accepts TLS 1.0
and 1.1, protocol versions deprecated by the IETF (lesson 10 explains why), and a new imaging
subnet must be allowed to reach it. The change is written up as a **request for change** (RFC):

```yaml
id: CHG-2041
title: Disable TLS 1.0 and 1.1 on the patient portal; allow the imaging subnet
type: normal
owner: Priya Nair (infrastructure)
stakeholders: [clinical systems, imaging department, service desk, information security]
impact_analysis:
  risk: medium
  affects: portal.example.test (nginx), imaging viewer 4.2 (legacy, speaks only TLS 1.0)
  dependencies: [OpenSSL 3 library, imaging viewer upgrade to 5.1 in CHG-2039]
  downtime: none expected; configuration reload, no restart
test_results: staging 2026-10-12, viewer 5.1 connects with TLS 1.3, viewer 4.2 refused as expected
approval: {board: CAB, date: 2026-10-13, decision: approved, condition: CHG-2039 done first}
maintenance_window: 2026-10-14 22:00-23:00 UTC
backout_plan: revert the commit in the config repository, nginx -t, systemctl reload nginx
documentation: [network diagram, TLS standard, portal SOP]
```

Each field is a step of the process:

- **Ownership.** One named **owner** is accountable for the change from plan to review. Changes
  with no owner are the ones nobody backs out at midnight.
- **Stakeholders** are everyone the change affects or who must act: the imaging department whose
  viewer depends on the portal, the service desk who will take the calls, security.
- **Impact analysis** asks what could break and what security effect the change has. Here it found
  a **legacy application**, viewer 4.2, that speaks only TLS 1.0, so the change was made to depend
  on the viewer upgrade.
- **Test results** from a staging environment show the change works and that the expected things
  fail.
- The **change advisory board** (CAB), a group of technical, business and security
  representatives, runs the **approval process**: it reviews the request, the risk and the plans,
  then approves, rejects or approves with conditions.
- A **maintenance window** is an agreed time, usually quiet hours, when changes may cause
  disruption.
- A **backout plan** says how to return to the previous state, how long it takes, and at what
  point you decide to use it.
- **Standard operating procedures** (SOPs) are written step-by-step instructions for routine
  tasks. Low-risk, repeatable changes that follow an SOP are often pre-approved as **standard
  changes**; urgent fixes go through an expedited **emergency change** path and are reviewed
  afterward.

Sometimes going back is impossible or worse than going on: a database migration has already
converted the data, or the old version has a vulnerability being actively exploited. Then the
team decides to **fail forward**: fix the problem with a further change instead of rolling back.
That decision belongs in the plan before the window starts, not in a panic during it.

## Technical implications

Changes that look small often have side effects the CAB needs to see:

- **Allow lists and deny lists.** An allow list permits only listed items (applications,
  addresses, ports) and blocks everything else; a deny list blocks listed items and permits the
  rest. A new application must be added to the application allow list, and a new subnet to the
  firewall allow list, or the change "works" in testing and fails in production.
- **Restricted activities.** The approval covers only what the request describes. Fixing an
  unrelated setting "while you are in there" is an unapproved change.
- **Downtime.** If the change needs the service to stop, users must be told and the window sized.
- **Service and application restarts.** A configuration change may take effect only after a
  restart. `systemctl reload nginx` rereads the configuration without dropping connections;
  `systemctl restart nginx` stops and starts the service, dropping every connection. An
  application restart can lose user sessions or in-memory work.
- **Legacy applications** may not support new protocols or patches, and their vendors may be gone.
- **Dependencies.** Programs rely on shared libraries and on other services. `ldd` lists the
  libraries a program loads; updating OpenSSL affects every program that links it:

```console
$ ldd /usr/bin/openssl
	linux-vdso.so.1 (0x00007ffce81f9000)
	libssl.so.3 => /lib/x86_64-linux-gnu/libssl.so.3 (0x0000700e97d45000)
	libcrypto.so.3 => /lib/x86_64-linux-gnu/libcrypto.so.3 (0x0000700e978bb000)
	libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x0000700e976d9000)
	/lib64/ld-linux-x86-64.so.2 (0x0000700e97ee2000)
```

A library update also takes effect only when the programs using it restart.

## Version control and documentation

Configuration belongs in **version control** such as Git, just like code. Every change is then a
commit that records who changed what and when, `diff` shows exactly what the change does, and
the previous version is always one command away. This is the CHG-2041 diff the CAB reviewed:

```console
$ diff -u before.conf after.conf
--- before.conf	2026-10-15 16:42:44.454017273 +0000
+++ after.conf	2026-10-15 16:42:44.458017472 +0000
@@ -3,7 +3,8 @@
     server_name portal.example.test;
     ssl_certificate     /etc/ssl/portal.crt;
     ssl_certificate_key /etc/ssl/private/portal.key;
-    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
+    ssl_protocols TLSv1.2 TLSv1.3;
     allow 10.20.0.0/16;
+    allow 10.30.8.0/24;
     deny  all;
 }
```

Two lines change: the protocol list and one new allow-list entry. Nothing else, which is what
"restricted activities" means in practice.

After the change, **documentation** must match reality: update network diagrams (the new subnet),
policies and standards (the TLS standard now forbids 1.0 and 1.1), and procedures (the portal
SOP). Outdated diagrams mislead the next impact analysis and the next incident responder.

## A change that had to be backed out

At 22:20, ten minutes after the reload, the service desk reported that a ward's label printer
workstation could no longer fetch patient labels: an undocumented dependency that still used TLS
1.0. The impact was clinical, the fix was not quick, and the plan's decision point said "back out
if patient-facing work is blocked". Priya reverted the commit, checked the configuration with
`nginx -t` and reloaded:

```console
$ git log --oneline
fc4e15d CHG-2041: disable TLS 1.0 and 1.1, allow imaging subnet
24fbdd8 Add portal web server config
$ git revert --no-edit HEAD
[main 284677d] Revert "CHG-2041: disable TLS 1.0 and 1.1, allow imaging subnet"
 Date: Wed Oct 14 22:31:00 2026 +0000
 1 file changed, 1 insertion(+), 2 deletions(-)
```

The revert is a new commit, so the history shows the change, its removal and the reason. The
post-implementation review added the workstation to the asset list and the dependency map, and a
new request scheduled its upgrade before CHG-2041 is tried again.

## Common mistakes

- **No backout plan, or an untested one.** "We will figure it out" is not a plan.
- **Impact analysis that ignores dependencies** such as legacy clients, shared libraries and
  integrations, the usual cause of surprise outages.
- **Restarting when a reload would do,** or forgetting that a library update needs a restart to
  take effect.
- **Scope creep in the window.** Unapproved extra changes break the audit trail and make backout
  harder.
- **Editing production by hand outside version control,** so nobody can tell what changed.
- **Leaving diagrams and procedures stale** after the change.

## Practice

1. Which item of the RFC would have caught the label printer if it had been done thoroughly?
2. A database schema upgrade converts 2 million records and cannot be reversed. What should the
   change plan say instead of "roll back"?
3. A new monitoring agent is installed on every server, and the endpoint protection blocks it.
   Which technical implication was missed?
4. During an approved firewall change, an engineer also opens port 3389 "for testing". Name the
   problem and why it matters for security.

### Answers

1. The impact analysis, specifically identifying dependencies and stakeholders (the ward's
   systems).
2. A fail-forward plan: take a verified backup before the change, define how failures will be
   fixed with further changes, and set the criteria for restoring the backup if all else fails.
3. The application allow list: the new agent was never added to it.
4. An unapproved change outside the restricted activities of the request. It opens an unreviewed
   remote access port, leaves no approval record, and would not be in the backout plan.

## Key takeaways

- Change management (NIST CM-3 and CM-4) is a security control: unreviewed changes cause outages
  and hide attacks.
- Every change has an owner, stakeholders, an impact analysis, test results, CAB approval, a
  maintenance window and a backout plan; fail forward only by prior decision.
- Watch the technical implications: allow and deny lists, restricted scope, downtime, restarts,
  legacy applications and dependencies.
- Keep configuration in version control and update diagrams, policies and procedures afterward.

## Further reading

- [NIST SP 800-53 Rev. 5, controls CM-3 and CM-4](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)
- [NIST SP 800-128, Guide for Security-Focused Configuration Management](https://csrc.nist.gov/pubs/sp/800/128/upd1/final)
- [Git documentation: git-revert](https://git-scm.com/docs/git-revert)
- [nginx: controlling nginx (reload and restart)](https://nginx.org/en/docs/control.html)
