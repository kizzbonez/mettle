# mfa_fatigue(): which approvals follow fatigue, and fatigue without a matching approval.
from pathlib import Path

rows = [
    # gave.in: five rejections, the first exactly 10 minutes before the approval
    ("01:00:00", "gave.in", "denied"), ("01:03:00", "gave.in", "denied"), ("01:06:00", "gave.in", "timeout"),
    ("01:08:00", "gave.in", "denied"), ("01:09:00", "gave.in", "denied"), ("01:10:00", "gave.in", "approved"),
    # held.out: the approval comes before the burst
    ("02:00:00", "held.out", "approved"), ("02:01:00", "held.out", "denied"), ("02:02:00", "held.out", "denied"),
    ("02:03:00", "held.out", "denied"), ("02:04:00", "held.out", "denied"), ("02:05:00", "held.out", "denied"),
    # late.ok: five rejections in a burst, but only four in the 10 minutes before the approval
    ("03:00:00", "late.ok", "denied"), ("03:01:00", "late.ok", "denied"), ("03:05:00", "late.ok", "denied"),
    ("03:06:00", "late.ok", "denied"), ("03:07:00", "late.ok", "denied"), ("03:10:01", "late.ok", "approved"),
    # second.one: the first approval is normal, the second follows a burst
    ("04:00:00", "second.one", "denied"), ("04:00:30", "second.one", "approved"),
    ("05:00:00", "second.one", "timeout"), ("05:01:00", "second.one", "timeout"), ("05:02:00", "second.one", "timeout"),
    ("05:03:00", "second.one", "timeout"), ("05:04:00", "second.one", "timeout"), ("05:04:30", "second.one", "approved"),
]
Path("t3-mfa.csv").write_text("time,user,result,app,ip\n" + "".join(
    f"2026-10-18T{t}Z,{user},{result},Outlook,198.51.100.7\n" for t, user, result in reversed(rows)))

got = dict(mfa_fatigue("t3-mfa.csv"))
assert got.get("gave.in") == "approved-after-fatigue", "a rejection exactly window_minutes before the approval counts"
assert got.get("held.out") == "fatigue", "an approval before the burst does not count as giving in"
assert got.get("late.ok") == "fatigue", "only rejections in the window up to the approval count for approved-after-fatigue"
assert got.get("second.one") == "approved-after-fatigue", "any approval of the user can follow fatigue, not only the first"
assert list(dict(mfa_fatigue("t3-mfa.csv"))) == ["gave.in", "held.out", "late.ok", "second.one"], "users sorted by name"
