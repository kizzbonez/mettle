Write two functions in `solution.py`. Ratings, levels and TLP labels are compared ignoring case
and the spaces around them; return them in lower case.

1. `risk(likelihood, impact)` returns the risk from the lesson's matrix. Both ratings are `low`,
   `medium` or `high`; raise `ValueError` for anything else.

   | Likelihood \ Impact | low | medium | high |
   | --- | --- | --- | --- |
   | **high** | medium | high | critical |
   | **medium** | low | medium | high |
   | **low** | low | low | medium |

2. `triage(path, today)` reads the merged feed at `path`, a CSV with the columns
   `source,type,value,valid_until,confidence,likelihood,impact,tlp`, and returns the indicators
   to load into the SIEM. `today` is a date such as `"2026-10-16"`.
   - Skip blank lines and lines starting with `#`; the first other line is the header.
   - Drop **expired** rows: `valid_until` (a `YYYY-MM-DD` date) before `today`. An indicator
     valid until today is still valid.
   - The SIEM is shared with the managed security provider, so drop rows whose `tlp` does not
     allow that: keep only `TLP:CLEAR`, `TLP:GREEN` and `TLP:AMBER` (the `SHAREABLE` set);
     `TLP:AMBER+STRICT` and `TLP:RED` stay out.
   - **Merge** the remaining rows that have the same `type` and the same `value` ignoring case.
     The merged indicator takes its `confidence`, `likelihood` and `impact` from the most
     confident row (`high` > `medium` > `low`); on a tie, from the first of them in the file.
     Its `sources` are the sorted, distinct `source` values of all the merged rows.
   - Return one dict per indicator: `{"type", "value", "risk", "confidence", "sources"}`, with
     `type` and `value` in lower case and `risk` from `risk(likelihood, impact)`.
   - Order: `risk` from `critical` to `low`, then `confidence` from `high` to `low`, then `type`,
     then `value`.

**Example.** `risk(" High", "MEDIUM")` is `"high"`. With `data/feed.csv`:

```python
triage("data/feed.csv", "2026-10-16")
# [{'type': 'ipv4', 'value': '203.0.113.66', 'risk': 'critical', 'confidence': 'high',
#   'sources': ['cisa-ais', 'waterisac']},
#  {'type': 'domain', 'value': 'scada-update.example.net', 'risk': 'high', 'confidence': 'high',
#   'sources': ['internal', 'kestrel-intel']},
#  {'type': 'sha256', 'value': '1af88ef1...5b5a06f', 'risk': 'medium', 'confidence': 'high',
#   'sources': ['internal']},
#  {'type': 'ipv4', 'value': '192.0.2.144', 'risk': 'medium', 'confidence': 'low',
#   'sources': ['kestrel-intel']},
#  {'type': 'ipv4', 'value': '198.51.100.77', 'risk': 'low', 'confidence': 'medium',
#   'sources': ['kestrel-intel']},
#  {'type': 'domain', 'value': 'hmi-portal.example.org', 'risk': 'low', 'confidence': 'low',
#   'sources': ['cisa-ais']}]
```

(The hash is shortened here; the real value is all 64 characters.) `198.51.100.23` expired on
10 October. The WaterISAC copy of the hash is `TLP:AMBER+STRICT`, so only our own `internal`
row is loaded, with its lower likelihood.

**Tip.** Filter the lines first, then pass the list to `csv.DictReader`, which accepts any
iterable of lines. ISO dates compare correctly as strings.
