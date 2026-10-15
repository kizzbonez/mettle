# The example from the instructions: the requests in data/requests.csv on 2 November 2026.
from datetime import date

devices = load_devices("data/devices.csv")
entitlements = load_entitlements("data/entitlements.csv")
requests = load_requests("data/requests.csv")
expected = [
    "allow",
    "allow",
    "deny (not entitled)",
    "deny (device not compliant)",
    "deny (identity not verified)",
    "deny (device not compliant)",
    "allow",
    "deny (not entitled)",
]
for number, (request, want) in enumerate(zip(requests, expected), start=1):
    got = decide(request, devices, entitlements, date(2026, 11, 2))
    assert got == want, f"decision for request {number} of data/requests.csv ({request['user']} on {request['device']} to {request['action']} {request['resource']}): got {got!r}"

ran = run_script()
assert ran.out.splitlines()[0] == "ana lt-0412 office shipments write: allow", (
    f"python solution.py should print one decision per request, got:\n{ran.out}{ran.err}"
)
