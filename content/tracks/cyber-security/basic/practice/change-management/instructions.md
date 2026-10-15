Each request for change in `data/changes.json` is a dict like the RFC in the lesson. Write the body
of **`check_change(change)`** in `solution.py`: it returns the list of problem codes that apply, in
the order below, or `[]` when the request meets the policy. The starter already gives you:

- `kind`, the request's `type` in lower case. `standard` and `emergency` are special; anything
  else, or no type at all, is a **normal** change.
- `text(change, key)`, a field with the spaces around it removed, or `""` when it is missing or
  `null`. Use it for every text field.
- `window_times(window)`, which turns `"2026-11-05 22:00-22:30"` into `("22:00", "22:30")`, or
  returns `None` when the window is malformed.

The policy:

1. `NO-OWNER`: the `owner` is empty.
2. `NOT-APPROVED`: a normal change needs `approval` equal to `approved` (ignoring case). A standard
   change is pre-approved but must name its `sop`. An emergency change is approved afterwards,
   so this rule never applies to it.
3. `UNTESTED`: a normal change with empty `test_results`. Standard and emergency changes are exempt.
4. `NO-BACKOUT`: both `backout_plan` and `fail_forward_plan` are empty. Either one is enough.
5. `OUTSIDE-WINDOW`: the change has `"restart": true` (it stops a service), is not an emergency, and
   its window is not inside the maintenance window: the start must be at or after `WINDOW_START`
   (`22:00`), the end at or before `WINDOW_END` (`23:59`), and the end after the start. A missing or
   malformed window is outside. Changes without a restart may run at any time.
6. `OUT-OF-SCOPE`: a file in `files_changed` is not in `scope`, the files the CAB approved
   (restricted activities). Missing lists count as empty.

Times in `HH:MM` form compare correctly as strings: `"21:59" < "22:00"` is `True`.

**Example.** `review("data/changes.json")`, already written, calls your function for every request
and returns these lines, which `python solution.py` prints:

```text
CHG-3101 OK
CHG-3102 OUTSIDE-WINDOW,OUT-OF-SCOPE
CHG-3103 NO-OWNER
CHG-3104 NO-BACKOUT
CHG-3105 OK
CHG-3106 NOT-APPROVED,UNTESTED,OUTSIDE-WINDOW
```

CHG-3102 restarts the billing servers at 21:00 and also edited `nginx/billing.conf`, which nobody
approved. CHG-3105 cannot be rolled back, but its fail-forward plan was agreed in advance.
