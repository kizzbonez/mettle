Write three functions in `solution.py`. An incident is a dict with the register's columns
(`id`, `opened`, `summary`, `origin`, `intent`, `motivation`, `resources`, `sophistication`,
`dwell_days`), all strings. Compare values ignoring case and the spaces around them.

1. `classify(incident)` returns the actor type. Apply these rules in order; the **first** that
   matches wins:
   1. `origin` is `internal`: `"accidental insider"` when `intent` is `none`, otherwise
      `"insider"`.
   2. `motivation` is `fear/chaos`: `"terrorist"`.
   3. `resources` is `very high`, or `motivation` is `espionage` or `influence`:
      `"state-sponsored"`.
   4. `motivation` is `political` or `ideological`: `"hacktivist"`.
   5. `motivation` is `financial` or `extortion`: `"crime syndicate"`.
   6. `motivation` is `intellectual property`: `"competitor"`.
   7. `sophistication` is `low`: `"unskilled attacker"`.
   8. Otherwise `"unknown"`.
2. `is_apt(incident)` returns `True` for an advanced persistent threat: `origin` is `external`,
   `resources` is `high` or `very high`, `sophistication` is `high` or `very high`, **and**
   `dwell_days` (the days the actor kept access) is at least 90. An empty `dwell_days` counts
   as 0.
3. `landscape(path)` reads the register (a CSV with a header line) and returns a dict:
   - `"actors"`: a dict from each actor type found to its number of incidents;
   - `"internal"` and `"external"`: the number of incidents with each `origin`;
   - `"apt"`: the sorted list of the `id`s of the incidents for which `is_apt` is true.

**Example.** With `data/incidents.csv`:

```python
landscape("data/incidents.csv")
# {'actors': {'hacktivist': 1, 'crime syndicate': 2, 'unskilled attacker': 2,
#             'accidental insider': 1, 'state-sponsored': 2, 'insider': 1,
#             'competitor': 1, 'terrorist': 1, 'unknown': 1},
#  'internal': 2, 'external': 10, 'apt': ['INC-0480', 'INC-0548']}
```

`INC-0548` has `high` resources, not `very high`, but its espionage motive makes it
state-sponsored (rule 3), and 95 days of access by a sophisticated actor make it an APT. A
financially motivated actor with very high resources is state-sponsored too, as North Korea's
thefts are: rule 3 comes before rule 5.

**Tip.** Write a small helper that returns `incident.get(key, "").strip().lower()`.
