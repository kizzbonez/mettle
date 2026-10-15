Write two functions in `solution.py`. The rules of engagement are `data/roe.json`: `scope` has
lists `in` and `out` of networks (such as `10.40.0.0/16`) and host names; `window` has `start`
and `end` dates, `hours_utc` `[8, 18]` and `blackout` dates; `passive`, `active` and `forbidden`
list technique names.

1. `in_scope(target, scope)` returns `True` or `False`. A target is a single IPv4 address
   (`203.0.113.10`), a network (`10.40.3.0/24`) or a host name:
   - an address or network is in scope when it lies entirely inside at least one `in` network
     and shares no address with any `out` network (an address is a network of one address);
   - a host name is in scope when it is in `in` and not in `out`, compared in lower case. Only
     exact names count: a subdomain of an in-scope name is not in scope.
2. `review_plan(roe_path, plan_path)` reads the rules and the plan (CSV:
   `id,time,target,technique`, times in UTC like `2026-11-09T08:00:00Z`; skip blank lines) and
   returns `"ID DECISION"` strings in plan order. The first rule that applies wins:
   1. `refused: forbidden technique` when the technique is in `forbidden`;
   2. `refused: unknown technique` when it is in neither `passive` nor `active`;
   3. `refused: out of scope` when the target is not `in_scope`;
   4. `refused: outside window` for an **active** technique when its date is before `start`,
      after `end` or a `blackout` date, or its time is not from 08:00 up to, not including,
      18:00 (the `hours_utc` pair). Passive reconnaissance never touches the target's systems,
      so it may happen at any time;
   5. `approved`.

**Example.**

```python
scope = {"in": ["203.0.113.0/27", "portal.ashgrove.example", "10.40.0.0/16"],
         "out": ["10.40.9.0/24", "payments.ashgrove.example"]}
in_scope("203.0.113.31", scope)          # True: the last address of the /27
in_scope("10.40.9.15", scope)            # False: inside the excluded /24
in_scope("10.40.0.0/16", scope)          # False: it overlaps 10.40.9.0/24
review_plan("data/roe.json", "data/plan.csv")
# ['P-01 approved', 'P-02 approved', 'P-03 approved', 'P-04 refused: out of scope',
#  'P-05 refused: out of scope', 'P-06 refused: outside window', 'P-07 approved',
#  'P-08 refused: forbidden technique', 'P-09 refused: outside window',
#  'P-10 refused: out of scope', 'P-11 refused: out of scope',
#  'P-12 refused: unknown technique', 'P-13 refused: outside window']
```

`P-01` searches certificate transparency logs a week early, which is fine for passive work.
`P-06` starts at 18:00, the end of the testing day, `P-09` falls on the blackout day and `P-13`
after the window. Phishing is forbidden whatever its target.

**Tips:** `ipaddress.ip_network(text)` reads an address or a network and raises `ValueError` for
a host name; `a.subnet_of(b)` and `a.overlaps(b)` compare networks. `datetime.fromisoformat`
reads a time; compare `.date().isoformat()` with the window's dates and `.hour` with the hours.
