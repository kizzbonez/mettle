Write two functions in `solution.py`. The response log is JSON Lines (one object per line; skip
blank lines), in the order people typed it, not in time order. Each entry has `time` (ISO 8601
with an offset, such as `+02:00`, or `Z` for UTC), `phase`, `action`, sometimes `host`, and `by`.
Clean `phase` and `host` by removing the spaces around them and making them lower case.

1. `timeline(path)` returns one string per entry, sorted by the moment it happened (entries at
   the same moment keep their file order): `"TIME [PHASE] ACTION HOST"`, where `TIME` is the
   time converted to UTC as `YYYY-MM-DDTHH:MM:SSZ`. Leave out ` HOST` (and its space) when the
   entry has no host.
2. `check_response(path)` checks the response against the playbook and returns a list of
   findings, in this order (an empty list when all is well). "First" and "earlier" refer to the
   UTC timeline:
   1. If there is a `declare-incident`: from the first one to the first `brief-leadership`,
      at most 60 minutes may pass. Otherwise add `LATE brief-leadership after N minutes`
      (`N` is the whole minutes, rounded down), or `MISSING brief-leadership` when there is none.
   2. `POWER-OFF HOST` for every `power-off`, in timeline order: isolation keeps a host running
      so its memory survives.
   3. `NO-MEMORY HOST` for every `reimage`, in timeline order, with no `capture-memory` of the
      same host earlier in the timeline.
   4. If there is a `breach-confirmed`: from the first one to the first `notify-authority`, at
      most 72 hours may pass (GDPR Art. 33). Otherwise add
      `LATE notify-authority after N hours` (whole hours, rounded down), or
      `MISSING notify-authority`.

**Example.** With `data/response-log.jsonl`, `timeline` begins

```python
['2026-10-13T22:52:00Z [identification] declare-incident',
 '2026-10-13T23:05:00Z [containment] isolate srv-imaging-01',
 '2026-10-13T23:20:00Z [containment] power-off srv-files-02',
 '2026-10-13T23:40:00Z [investigation] capture-memory srv-imaging-01',
 '2026-10-14T00:07:00Z [notification and external reporting] brief-leadership',
 ...]
```

and `check_response("data/response-log.jsonl")` is

```python
['LATE brief-leadership after 75 minutes', 'POWER-OFF srv-files-02',
 'NO-MEMORY srv-files-02', 'LATE notify-authority after 75 hours']
```

Leadership heard 75 minutes after the declaration, the file server was switched off and later
rebuilt with no memory image, and the regulator was told 75 hours and 40 minutes after the
breach was confirmed.

**Tips:** `datetime.fromisoformat(text)` reads both offsets and `Z`;
`.astimezone(timezone.utc)` converts, and `.strftime("%Y-%m-%dT%H:%M:%SZ")` formats.
`sorted(..., key=...)` is stable, so ties keep their order. A `timedelta`'s `total_seconds()`
compares with `60 * 60`, and `// 60` rounds down.
