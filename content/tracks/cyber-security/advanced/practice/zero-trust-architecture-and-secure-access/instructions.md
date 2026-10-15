Write `decide(request, inventory, apps, now)` in `solution.py`. It returns a tuple
`(decision, reasons)`: `decision` is `"allow"`, `"limited"` or `"deny"`, and `reasons` is a list
of reason codes in the order below (empty when nothing failed).

- `request` has `user`, `device`, `app`, `mfa` (`"none"`, `"sms"`, `"otp"`, `"push"` or
  `"passkey"`) and `country` (a two-letter code).
- `inventory` maps device names to their posture from the device management system: `owner`,
  `os_patch_date` (`"YYYY-MM-DD"`), `edr_running`, `disk_encrypted` and `last_seen` (when the
  device last reported, like `"2026-10-15T08:40:00Z"`).
- `apps` maps application names to `sensitivity` (`"high"` or `"standard"`), `users` (who is
  entitled) and `countries` (where access is allowed from).
- `now` is a timezone-aware `datetime` in UTC. Never read the clock.

1. If `request["app"]` is not in `apps`, return `("deny", ["unknown-app"])` at once.
2. Otherwise check every rule below and collect the code of each one that fails, in this order:
   1. `not-entitled`: the user is not in the app's `users`.
   2. `no-mfa` when `mfa` is `"none"`; otherwise `weak-mfa` when the app's sensitivity is
      `"high"` and `mfa` is not `"passkey"` (only a passkey is phishing-resistant here).
   3. `unmanaged-device` when the device is not in `inventory`, and then skip the device checks.
      Otherwise, in this order: `not-owner` (the device's `owner` is not the user), `edr-off`
      (`edr_running` is not `true`), `disk-unencrypted` (`disk_encrypted` is not `true`),
      `unpatched` (`now`'s date is **more than** `PATCH_DAYS` (30) days after `os_patch_date`)
      and `stale-posture` (`now` is **more than** `POSTURE_HOURS` (24) hours after `last_seen`,
      so the posture can no longer be trusted).
   4. `blocked-country`: the request's `country`, compared ignoring case, is not in the app's
      `countries`.
3. The decision is `"allow"` when no rule failed, `"limited"` (a browser-only session through
   the broker) when the **only** failure is `unmanaged-device` and the app's sensitivity is
   `"standard"`, and `"deny"` otherwise.

**Example.** With the files in `data/` and `now = datetime(2026, 10, 15, 9, 0, tzinfo=timezone.utc)`:

```text
request (user, device, app, mfa, country)               decide(...)
mira  LT-2207  drawings-vault  passkey  IE              ('allow', [])
mira  LT-2207  drawings-vault  push     IE              ('deny', ['weak-mfa'])
tomas LT-2215  drawings-vault  passkey  GB              ('deny', ['unpatched'])
ines  LT-2231  timesheets      otp      IE              ('deny', ['edr-off', 'stale-posture'])
ola.contractor HOME-PC timesheets otp   PT              ('limited', ['unmanaged-device'])
devon LT-2207  finance         passkey  ES              ('deny', ['not-owner', 'blocked-country'])
devon MB-0904  drawings-vault  passkey  IE              ('deny', ['not-entitled'])
mira  LT-2207  payroll-v1      passkey  IE              ('deny', ['unknown-app'])
```

`LT-2215` was last patched 48 days before `now`, and `LT-2231` last reported almost 39 hours ago.

**Tips.** `date.fromisoformat()` and `datetime.fromisoformat()` read the dates (the second
accepts the trailing `Z`); subtracting two dates gives a `timedelta` with `.days`, and a
`timedelta` compares with `timedelta(hours=24)`.
