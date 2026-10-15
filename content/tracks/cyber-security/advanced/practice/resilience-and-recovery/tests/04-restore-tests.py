# restore_findings: the latest test, the 90-day limit, the RTO boundary, verification and order.
from datetime import date


def test(system, day, minutes, verified="yes"):
    return {"system": system, "date": day, "minutes": str(minutes), "verified": verified}


tests = [
    test("crm", "2026-12-15", 45),
    test("crm", "2026-11-01", 300, "no"),
    test("wiki", "2026-10-01", 500, "no"),
    test("wiki", "2026-10-02", 20),
    test("mail", "2026-12-02", 120, "No"),
    test("mail", "2026-12-02", 121, "yes"),
    test("erp", "2026-10-04", 240, "yes"),
    test("files", "2026-12-20", 59, ""),
]
today = date(2027, 1, 1)
cases = [
    ("crm", 60, [], "a system whose latest test is listed before an older, failed one"),
    ("wiki", 60, ["stale 2026-10-02"], "a latest test 91 days before today"),
    ("mail", 120, ["slow 121"], "two tests on the same date: the later row counts"),
    ("erp", 240, [], "a test 89 days ago that took exactly the RTO"),
    ("files", 60, ["unverified"], "an empty verified field"),
    ("hr", 60, ["no-test"], "a system with no restore test"),
]
for system, rto, expected, what in cases:
    got = restore_findings(tests, system, rto, today)
    assert got == expected, f"restore_findings for {what}"

old = [test("ledger", "2026-01-15", 400, "no")]
assert restore_findings(old, "ledger", 240, today) == ["stale 2026-01-15", "slow 400", "unverified"], (
    "restore_findings with all three problems, in order"
)
on_the_limit = [test("ledger", "2026-10-03", 10)]
assert restore_findings(on_the_limit, "ledger", 240, today) == [], "a latest test exactly 90 days before today is not stale"
assert restore_findings([], "ledger", 240, today) == ["no-test"], "restore_findings with no tests at all"
