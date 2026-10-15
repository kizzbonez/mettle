Write two functions in `solution.py`. `policy` is `data/pharmacy-access.json` parsed with
`json.load` (or another policy of the same shape): `roles` (name to `permissions` and `hours`),
`users` (name to a list of `roles` and an `expires` date or `null`) and `jit` (just-in-time
grants). Use `MAX_JIT_MINUTES` (120) and `CONFLICTS` from the starter. Never read the clock.

1. `decide(policy, user, permission, at)` returns a tuple `(decision, via)` for a request made at
   `at`, a `datetime`. Apply these rules in order:
   1. A user not in `users`: `("deny", "unknown-user")`.
   2. `expires` is the account's last day (`"YYYY-MM-DD"`): after that day,
      `("deny", "expired")`, even for a JIT grant.
   3. **Roles (RBAC, time-based).** For each of the user's roles in order: when the role has the
      permission and `at` is within its `hours`, `("allow", "role:<role>")`. `hours` is
      `["HH:MM", "HH:MM"]`, start included and end excluded, or `null` for any time. When the end
      is not later than the start, the window wraps past midnight: `["20:00", "08:00"]` is 20:00
      to 23:59 and 00:00 to 07:59. A role that is not in `roles` grants nothing.
   4. **Just-in-time.** For each grant in `jit` in order: when it is for this user and
      permission, it is **valid** (its `ticket` is not empty and its `minutes` is at most
      `MAX_JIT_MINUTES`), and `start <= at < start + minutes`, `("allow", "jit:<ticket>")`.
   5. Otherwise `("deny", "outside-hours")` if one of the user's roles has the permission, and
      `("deny", "not-granted")` if none does.
2. `review(policy, review_date)` returns the access review findings as a list of strings:
   - for each user, in the order of `users`: `EXPIRED <user> <expires>` when `expires` is before
     `review_date` and the user's `roles` list is not empty; then, for each pair `(a, b)` in
     `CONFLICTS` in order, `SOD <user> <a>+<b>` when the user's roles together grant both
     permissions (separation of duties);
   - then, for each `jit` grant in order that is not valid, `JIT-INVALID <user> <permission>
     no-ticket` (empty ticket) or, otherwise, `JIT-INVALID <user> <permission> too-long`.

**Example.** With the policy in `data/`:

```python
decide(policy, "a.mensah", "dispense", datetime(2026, 11, 12, 10, 30))       # ('allow', 'role:pharmacist')
decide(policy, "a.mensah", "dispense", datetime(2026, 11, 12, 21, 0))        # ('deny', 'outside-hours')
decide(policy, "r.quinn", "dispense", datetime(2026, 11, 13, 2, 15))         # ('allow', 'role:night-pharmacist')
decide(policy, "r.quinn", "approve-controlled", datetime(2026, 11, 13, 2, 15))  # ('deny', 'not-granted')
decide(policy, "it.dara", "admin-console", datetime(2026, 11, 12, 23, 59))   # ('allow', 'jit:CHG-2291')
decide(policy, "it.dara", "admin-console", datetime(2026, 11, 13, 0, 0))     # ('deny', 'not-granted')
decide(policy, "l.byrne", "approve-controlled", datetime(2026, 11, 12, 10, 0))  # ('deny', 'not-granted')
decide(policy, "s.ahmed", "pick", datetime(2026, 11, 12, 10, 0))             # ('deny', 'expired')

review(policy, date(2026, 11, 12))
# ['EXPIRED s.ahmed 2026-10-31',
#  'SOD p.walsh order-stock+receive-stock',
#  'SOD m.fitz approve-controlled+view-audit',
#  'JIT-INVALID l.byrne approve-controlled too-long',
#  'JIT-INVALID it.dara dispense no-ticket']
```

`l.byrne`'s eight-hour grant is longer than the limit, so it grants nothing; `it.dara`'s grant
ends at midnight, the moment it stops working.

**Tips.** `time.fromisoformat("07:00")`, `date.fromisoformat()` and `datetime.fromisoformat()`
read the policy's values; `at.time()` and `at.date()` give the parts of `at` to compare, and
`timedelta(minutes=...)` the end of a grant.
