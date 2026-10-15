Write the body of **`decide(request, devices, entitlements, today=TODAY)`** in `solution.py`. The
starter already loads the three CSV files in `data/`:

- `request` is one row of `requests.csv`: a dict with the keys `user`, `device`, `network`,
  `resource`, `action` (`read` or `write`) and `mfa`.
- `devices` comes from `load_devices`: `{device: {"managed": ..., "encrypted": ..., "last_patched": date}}`,
  with `managed` and `encrypted` already lower case.
- `entitlements` comes from `load_entitlements`: `{user: {resource: "read" or "write"}}`.

Check the rules **in this order** and return the text of the first one that fails:

1. **Verify identity.** `request["mfa"]`, ignoring case and spaces around it, must be `yes`.
   Otherwise return `deny (identity not verified)`.
2. **Verify the device.** The device must be in `devices`, with `managed` and `encrypted` both
   `yes`, and `(today - last_patched).days` at most `PATCH_DAYS` (30). Otherwise return
   `deny (device not compliant)`.
3. **Least privilege.** The user must have an entitlement for the resource. A `read` request needs
   `read` or `write` access; a `write` request needs `write` access. Otherwise return
   `deny (not entitled)`.
4. Otherwise return `allow`.

Never use `request["network"]`: being in the office earns no trust, and working from a hotel
loses none.

**Example.** `python solution.py` prints the decisions for `data/requests.csv` on 2 November 2026:

```text
ana lt-0412 office shipments write: allow
ana lt-0412 hotel-wifi customs-docs read: allow
ana lt-0412 office customs-docs write: deny (not entitled)
ravi pc-home-ravi office shipments read: deny (device not compliant)
ravi tab-0077 home fleet-tracking read: deny (identity not verified)
dmitri lt-0419 office payroll read: deny (device not compliant)
dmitri tab-0077 home payroll read: allow
ravi tab-0077 office payroll read: deny (not entitled)
```

Ravi's home PC is refused although it is plugged in at the office; `lt-0419` was last patched 48
days earlier; Ana may read customs documents but not change them.

**Tip.** `entitlements.get(user, {}).get(resource)` gives the access, or `None` when there is no
entitlement.
