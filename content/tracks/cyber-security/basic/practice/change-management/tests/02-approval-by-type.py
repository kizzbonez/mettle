# Approval and testing depend on the type of change.
base = {
    "id": "CHG-T2",
    "owner": "Lin Chow",
    "test_results": "staging passed",
    "backout_plan": "revert the commit",
    "restart": False,
    "scope": ["a.conf"],
    "files_changed": ["a.conf"],
}


def codes(**fields):
    change = dict(base)
    change.update(fields)
    return check_change(change)


assert codes(type="normal", approval="approved") == [], "a normal change approved by the CAB, tested and with a backout plan passes"
assert codes(type="normal", approval="  APPROVED ") == [], "the approval is compared without regard to case and surrounding spaces"
for decision in ["rejected", "pending", "", "approved with conditions"]:
    assert codes(type="normal", approval=decision) == ["NOT-APPROVED"], "a normal change needs the approval to be exactly approved"
assert codes(type="normal", approval="approved", test_results="  ") == ["UNTESTED"], "a normal change with blank test results is untested"

assert codes(type="standard", sop="SOP-7 add a DNS record", approval="") == [], "a standard change that names its SOP is pre-approved"
assert codes(type="standard", sop="", approval="approved") == ["NOT-APPROVED"], "a standard change must name its SOP, whatever the approval says"
assert codes(type="Standard", sop="SOP-7", approval="", test_results="") == [], "standard changes need no test results, and the type ignores case"

assert codes(type="emergency", approval="pending", test_results="") == [], "an emergency change is reviewed afterwards: no approval or test results yet"

assert codes(type=" NORMAL ", approval="approved") == [], "the type is compared without regard to case and surrounding spaces"
assert codes(type="major", approval="pending") == ["NOT-APPROVED"], "an unknown type is treated as a normal change"
no_type = dict(base, approval="approved", test_results="")
assert check_change(no_type) == ["UNTESTED"], "a request without a type is treated as a normal change"
