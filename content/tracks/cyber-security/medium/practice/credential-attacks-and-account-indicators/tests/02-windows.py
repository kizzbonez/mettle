# mfa_fatigue(): the window boundary, timeouts, file order and the limit and window arguments.
from pathlib import Path


def log(name, rows):
    Path(name).write_text("time,user,result,app,ip\n" + "".join(
        f"2026-10-17T{t}Z,{user},{result},VPN,192.0.2.9\n" for t, user, result in rows))


log("t2-mfa.csv", [
    ("03:10:00", "edge.in", "denied"), ("03:00:00", "edge.in", "denied"), ("03:02:00", "edge.in", "timeout"),
    ("03:05:00", "edge.in", "timeout"), ("03:07:30", "edge.in", "denied"),
    ("04:00:00", "edge.out", "denied"), ("04:02:00", "edge.out", "denied"), ("04:05:00", "edge.out", "denied"),
    ("04:08:00", "edge.out", "denied"), ("04:10:01", "edge.out", "denied"),
    ("05:00:00", "four.only", "denied"), ("05:01:00", "four.only", "denied"),
    ("05:02:00", "four.only", "denied"), ("05:03:00", "four.only", "denied"),
    ("06:00:00", "calm", "approved"), ("06:30:00", "calm", "approved"),
])
assert mfa_fatigue("t2-mfa.csv") == [("edge.in", "fatigue")], (
    "five rejected prompts with the last exactly 10 minutes after the first are fatigue; "
    "10 minutes 1 second is too long, four are too few, and approvals alone are nothing"
)
assert mfa_fatigue("t2-mfa.csv", limit=4) == [("edge.in", "fatigue"), ("edge.out", "fatigue"), ("four.only", "fatigue")], (
    "the limit argument should be used"
)
assert mfa_fatigue("t2-mfa.csv", window_minutes=3) == [], "the window_minutes argument should be used"
assert mfa_fatigue("t2-mfa.csv", limit=2, window_minutes=1) == [("four.only", "fatigue")], (
    "both arguments together: two rejected prompts one minute apart"
)
