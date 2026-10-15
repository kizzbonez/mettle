# The example from the instructions.
got = timeline("data/response-log.jsonl")
expected = [
    "2026-10-13T22:52:00Z [identification] declare-incident",
    "2026-10-13T23:05:00Z [containment] isolate srv-imaging-01",
    "2026-10-13T23:20:00Z [containment] power-off srv-files-02",
    "2026-10-13T23:40:00Z [investigation] capture-memory srv-imaging-01",
    "2026-10-14T00:07:00Z [notification and external reporting] brief-leadership",
    "2026-10-14T09:30:00Z [investigation] breach-confirmed",
    "2026-10-14T14:00:00Z [eradication and recovery] reimage srv-files-02",
    "2026-10-14T16:00:00Z [eradication and recovery] reimage srv-imaging-01",
    "2026-10-17T13:10:00Z [notification and external reporting] notify-authority",
    "2026-10-21T08:00:00Z [post-incident] lessons-learned",
]
assert isinstance(got, list), "timeline should return a list of strings"
assert len(got) == len(expected), f"timeline should have one line per entry ({len(expected)}), not {len(got)}"
for n, (want, have) in enumerate(zip(expected, got), 1):
    assert have == want, f"timeline line {n} should be {want!r}, not {have!r}"

findings = check_response("data/response-log.jsonl")
assert findings == [
    "LATE brief-leadership after 75 minutes",
    "POWER-OFF srv-files-02",
    "NO-MEMORY srv-files-02",
    "LATE notify-authority after 75 hours",
], f"check_response for data/response-log.jsonl should give the four findings of the example, not {findings!r}"
