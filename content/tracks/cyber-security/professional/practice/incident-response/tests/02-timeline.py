# timeline: negative and zero offsets, dates that change in UTC, ties, cleaning and blank lines.
import json

entries = [
    {"time": "2026-10-20T01:30:00-04:00", "phase": " Identification", "action": "declare-incident", "by": "IC"},
    {"time": "2026-10-20T05:30:00Z", "phase": "CONTAINMENT", "action": "isolate", "host": " WS-RECEPTION-03 ", "by": "SOC"},
    {"time": "2026-10-20T07:00:00+02:00", "phase": "Investigation", "action": "threat-hunt", "by": "SOC"},
    None,
    {"time": "2026-10-19T23:59:59-05:00", "phase": "Identification", "action": "edr-alert", "host": "ws-reception-03", "by": "EDR"},
    {"time": "2026-10-20T05:30:00+00:00", "phase": "containment", "action": "block-ip", "by": "network team"},
]
with open("t2-log.jsonl", "w") as f:
    for entry in entries:
        f.write("\n" if entry is None else json.dumps(entry) + "\n")

got = timeline("t2-log.jsonl")
assert got == [
    "2026-10-20T04:59:59Z [identification] edr-alert ws-reception-03",
    "2026-10-20T05:00:00Z [investigation] threat-hunt",
    "2026-10-20T05:30:00Z [identification] declare-incident",
    "2026-10-20T05:30:00Z [containment] isolate ws-reception-03",
    "2026-10-20T05:30:00Z [containment] block-ip",
], "entries converted to UTC and sorted by moment, ties in file order, phase and host cleaned, blank lines skipped"
