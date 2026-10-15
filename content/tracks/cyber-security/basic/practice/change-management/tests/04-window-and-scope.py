# The maintenance window for restarts, and changes to files outside the approved scope.
base = {
    "id": "CHG-T4",
    "type": "normal",
    "owner": "Lin Chow",
    "approval": "approved",
    "test_results": "staging passed",
    "backout_plan": "revert the commit",
    "scope": ["nginx/site.conf", "nginx/tls.conf"],
    "files_changed": ["nginx/site.conf"],
}


def codes(**fields):
    change = dict(base)
    change.update(fields)
    return check_change(change)


assert codes(restart=True, window="2026-12-01 22:00-23:59") == [], "a restart from 22:00 to 23:59 is inside the window"
assert codes(restart=True, window="2026-12-01 23:15-23:45") == [], "a restart from 23:15 to 23:45 is inside the window"
assert codes(restart=True, window="2026-12-01 21:59-22:30") == ["OUTSIDE-WINDOW"], "a restart starting at 21:59 starts before the window"
assert codes(restart=True, window="2026-12-01 22:30-00:15") == ["OUTSIDE-WINDOW"], "a restart running past midnight ends outside the window"
assert codes(restart=True, window="2026-12-01 23:00-22:30") == ["OUTSIDE-WINDOW"], "a window whose end is not after its start is outside the window"
assert codes(restart=True, window="") == ["OUTSIDE-WINDOW"], "a restart with no window is outside the window"
assert codes(restart=True, window="tonight") == ["OUTSIDE-WINDOW"], "a restart with a malformed window is outside the window"
assert codes(restart=False, window="2026-12-01 14:00-14:30") == [], "a change without a restart may run outside the window"
assert codes(window="2026-12-01 14:00-14:30") == [], "a request without a restart field has no restart"
assert codes(type="emergency", approval="", restart=True, window="2026-12-01 03:00-03:10") == [], (
    "an emergency change may restart outside the window"
)

assert codes(files_changed=["nginx/site.conf", "nginx/tls.conf"]) == [], "changing only approved files is in scope"
assert codes(files_changed=[]) == [], "changing no files is in scope"
assert codes(files_changed=["nginx/site.conf", "sshd_config"]) == ["OUT-OF-SCOPE"], "changing a file outside the scope is out of scope"
assert codes(scope=[], files_changed=["nginx/site.conf"]) == ["OUT-OF-SCOPE"], "with an empty scope, any changed file is out of scope"
assert codes(owner="", restart=True, window="2026-12-01 12:00-12:05", files_changed=["x.conf"]) == [
    "NO-OWNER", "OUTSIDE-WINDOW", "OUT-OF-SCOPE"
], "several problems are listed in the order of the instructions"
