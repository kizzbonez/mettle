# The example from the instructions.
from pathlib import Path

flags = red_flags(Path("data/report-01.eml").read_text(encoding="utf-8"))
assert flags == ["auth-fail", "display-name", "lookalike", "reply-to", "urgency"], (
    f"red_flags of data/report-01.eml should be all five flags, sorted, not {flags!r}"
)
expected = [
    ("report-01.eml", 10, "phishing"),
    ("report-05.eml", 4, "suspicious"),
    ("report-03.eml", 3, "suspicious"),
    ("report-04.eml", 1, "benign"),
    ("report-02.eml", 0, "benign"),
]
got = triage(sorted(Path("data").glob("report-*.eml")))
if got != expected:
    for name in sorted(Path("data").glob("report-*.eml")):
        print(name.name, red_flags(name.read_text(encoding="utf-8")))
assert got == expected, "triage of the five reports in data/ should match the example in the instructions"
