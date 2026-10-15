# Owners, backout plans and fail-forward plans, including fields that are missing altogether.
assert check_change({"id": "CHG-EMPTY"}) == ["NO-OWNER", "NOT-APPROVED", "UNTESTED", "NO-BACKOUT"], (
    "a request with no fields at all: missing fields count as empty, codes in the order of the instructions"
)

base = {
    "id": "CHG-T3",
    "type": "normal",
    "owner": "Lin Chow",
    "approval": "approved",
    "test_results": "staging passed",
    "restart": False,
}


def codes(**fields):
    change = dict(base)
    change.update(fields)
    return check_change(change)


assert codes(owner="   ", backout_plan="revert") == ["NO-OWNER"], "an owner of only spaces is no owner"
assert codes(owner=None, backout_plan="revert") == ["NO-OWNER"], "an owner of null is no owner"
assert codes(backout_plan="", fail_forward_plan="") == ["NO-BACKOUT"], "a change with neither plan has no backout"
assert codes(backout_plan=" ", fail_forward_plan=None) == ["NO-BACKOUT"], "plans of only spaces or null do not count"
assert codes(backout_plan="", fail_forward_plan="fix with follow-up changes") == [], "a fail-forward plan decided in advance is enough"
assert codes(backout_plan="restore the snapshot") == [], "a backout plan is enough without a fail-forward plan"
assert codes(type="emergency", approval="", test_results="", backout_plan="") == ["NO-BACKOUT"], (
    "emergency changes still need a backout or fail-forward plan"
)
