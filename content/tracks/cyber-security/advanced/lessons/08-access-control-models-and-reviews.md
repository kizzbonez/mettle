---
title: Access Control Models and Reviews
summary: Read permissions for what they really allow, compare discretionary, mandatory, role-based, rule-based, time-based and just-in-time access control, separate technical from administrative policies, and run an access review that finds leavers, unused access and separation-of-duties conflicts (SY0-801 objective 4.5).
minutes: 35
objectives:
  - Work out the effective access that permissions, inheritance and group membership grant, and spot assignments that allow privilege escalation
  - Compare DAC, MAC, RBAC, rule-based, time-based and just-in-time access control and choose one for a scenario
  - Distinguish logical/technical from administrative/business access policies
  - Run an access review that flags leavers, unused entitlements and separation-of-duties conflicts
---

## Outline

1. Permissions and their implications
2. Discretionary and mandatory access control
3. Role-based, rule-based and time-based access control
4. Just-in-time access
5. Technical and administrative policies
6. Access reviews

## Permissions and their implications

**Authorization** decides what an authenticated subject may do to an object. Its building blocks are permissions: read, write, execute on Linux; read, write, modify and full control on Windows NTFS; view, edit and share in a SaaS app. Permissions are rarely set one by one. They are inherited from parent folders and granted through groups, so a person's **effective permissions** are the combination of everything that applies to them (on Windows an explicit deny overrides an allow).

The implications are what matter. A server runs `/opt/backup/nightly.sh` as root every night. The script itself looks safe; this is from a sandbox copy, where the owner is `sandbox` instead of `root`:

```console
$ ls -ld opt/backup opt/backup/nightly.sh
drwxrwxrwx 2 sandbox sandbox 4096 2026-10-01 opt/backup
-rwxr-xr-x 1 sandbox sandbox   49 2026-10-01 opt/backup/nightly.sh
$ find opt -perm -o+w
opt/backup
```

The file is not writable by others, but its directory is (`rwxrwxrwx`, no sticky bit). Write permission on a directory lets anyone delete or rename the files in it, so any local user can replace `nightly.sh` with their own script, and root will run it tonight. That is privilege escalation through a permission that looked harmless. The same pattern appears on Windows as a service binary in a folder where `Users` have Modify. Review permissions on the whole path, not only the file.

## Discretionary and mandatory access control

**Discretionary access control (DAC)** lets the owner of an object decide who may use it. Unix permissions, NTFS access control lists and "share this document" buttons are DAC. It is flexible and easy, and it relies on every owner's judgment: one user can share a confidential file with everyone.

**Mandatory access control (MAC)** takes the decision away from owners. The system assigns **labels** to objects (classification such as Confidential or Secret) and **clearances** to subjects, and a central policy compares them; a user cannot pass a Secret document to someone without the clearance, even if they own it. Military and government systems use MAC, and SELinux brings it to Linux (lesson 5). It is strong and rigid, and labeling everything correctly is real work.

## Role-based, rule-based and time-based access control

**Role-based access control (RBAC)** grants permissions to **roles** (nurse, billing clerk, payroll approver), and people get roles. When someone changes job you change their role, not fifty individual permissions, which makes provisioning, deprovisioning and reviews tractable. Groups in Active Directory, IAM roles in the cloud and sudoers group rules are RBAC. Too many narrowly defined roles ("role explosion") brings back the complexity RBAC was meant to remove.

**Rule-based access control** applies rules that hold for every subject, whatever their identity or role: firewall ACLs, "block sign-ins from countries where we have no staff", "uploads larger than 50 MB are refused". Conditional access policies in identity platforms are rule-based controls layered on top of RBAC.

**Time-based access control** limits when access works: badge readers that open the pharmacy only during shifts, logins allowed only in business hours, a contractor account that expires on a set date. It narrows the window an attacker can use stolen credentials in.

Many products combine these, deciding from attributes of the user, the resource and the context. That generalization is called attribute-based access control (ABAC), described in NIST SP 800-162.

## Just-in-time access

Standing privilege, an administrator who is an administrator all day every day, is exposure even while nobody uses it. **Just-in-time (JIT)** access removes it: the administrator requests elevation for a task, states a reason (often a ticket number), gets approval or passes an MFA check, and the privilege is granted for a fixed time (say two hours) and removed automatically. Microsoft Entra Privileged Identity Management and similar privileged access management tools implement JIT, and the request records make reviews easy: every use of power has a who, when and why.

## Technical and administrative policies

Access management needs both kinds of policy:

- **Logical or technical policies** are enforced by systems: the minimum password length in Group Policy, a conditional access rule that requires MFA, an ACL, the session timeout in an application.
- **Administrative or business policies** are written rules people follow: the access control policy, the requirement that a data owner approves access to restricted data, separation of duties, the review schedule.

An administrative policy without a technical control depends on everyone remembering; a technical control without a policy has no stated reason, owner or exception process. Mature programs pair them.

## Access reviews

An **access review** (recertification) asks the people who know, managers and data owners, to confirm that each person still needs each access, and removes what is not confirmed. NIST SP 800-53 control AC-2 requires organizations to "review accounts for compliance with account management requirements" at a defined frequency, and AC-2(3) to disable accounts that are inactive for a defined period. Reviews catch what provisioning missed: leavers, privilege creep, unused access and **separation of duties (SoD)** conflicts, where one person holds two powers that should be split, such as creating a vendor and approving payments to it.

Tooling prepares the review so reviewers spend their time on decisions. This pandas script joins entitlements with the HR roster, using a fixed review date:

```python
import pandas as pd

REVIEW_DATE = pd.Timestamp("2026-10-01")
CONFLICTS = [{"vendor-create", "payroll-approve"}]  # separation of duties

ent = pd.read_csv("entitlements.csv", parse_dates=["last_used"])
hr = pd.read_csv("hr.csv")
df = ent.merge(hr, on="user", how="left")

df["leaver"] = df["status"] != "active"
df["unused_days"] = (REVIEW_DATE - df["last_used"]).dt.days
df["unused"] = df["unused_days"] > 90
held = df.groupby("user")["entitlement"].agg(set)
sod = {u for u, s in held.items() if any(c <= s for c in CONFLICTS)}
df["sod_conflict"] = df["user"].isin(sod)

flagged = df[df["leaver"] | df["unused"] | df["sod_conflict"]]
print(flagged[["user", "role", "entitlement", "unused_days", "leaver", "unused", "sod_conflict"]]
      .to_string(index=False))
```

```text
 user    role      entitlement  unused_days  leaver  unused  sod_conflict
amara finance  payroll-approve            2   False   False          True
amara finance    vendor-create           29   False   False          True
jonas billing clinical-records          173   False    True         False
 ravi billing          billing           45    True   False         False
```

Ravi left but still has billing access (a deprovisioning failure); Jonas moved to billing and kept clinical records he has not used for 173 days (privilege creep); Amara can both create vendors and approve payments. Each row goes to the right owner, and the decisions (keep, remove, keep with a compensating control) are recorded as audit evidence. The same data feeds **account auditing** and a **policy report** for management: how many findings, how fast they were closed.

## Common mistakes

- Checking a file's permissions but not its directory's.
- Granting access to individuals instead of roles, so nobody can say why it exists.
- Reviews where managers approve every line without reading ("rubber-stamping").
- Permanent admin rights because JIT "slows us down".
- A written policy with no technical control, or a control with no policy behind it.

## Practice

1. Name the model: (a) a document's owner shares it with a colleague; (b) a Secret file cannot be opened by a user cleared to Confidential; (c) all billing clerks get the billing group.
2. What one command fixes the backup directory, and why does it work?
3. Add a rule to the review script that flags any entitlement held by a user whose HR role is `nursing` and whose entitlement starts with `billing`.
4. An engineer needs root on production twice a month for patching. Propose the access design.

### Answers

1. (a) DAC, (b) MAC, (c) RBAC.
2. `chmod 755 opt/backup` (with root as owner): only the owner may then create, delete or rename files in it.
3. `df["role_conflict"] = (df["role"] == "nursing") & df["entitlement"].str.startswith("billing")`, and add it to the filter.
4. JIT elevation: request with the change ticket, MFA and approval, a time limit covering the maintenance window, automatic removal, and the request log reviewed monthly.

## Key takeaways

- Effective permissions come from inheritance and groups; write access to a path can be privilege escalation.
- DAC: owners decide. MAC: labels and clearances decide. RBAC: roles decide. Rules and time windows add conditions.
- JIT replaces standing privilege with approved, time-limited elevation.
- Pair every technical control with an administrative policy, and the reverse.
- Access reviews find leavers, creep, unused access and SoD conflicts; record the decisions.

## Further reading

- [NIST SP 800-53 Rev. 5: control AC-2, Account Management](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)
- [NIST SP 800-162: Guide to Attribute Based Access Control](https://csrc.nist.gov/pubs/sp/800/162/upd2/final)
- [Microsoft Entra Privileged Identity Management](https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-configure)
