# check_action: the rate limit counts the same tool, less than 3,600 seconds earlier.
policy = {
    "tools": {
        "edr.isolate_host": {"allowed": True, "requires_approval": "soc-lead", "max_per_hour": 2},
        "siem.search": {"allowed": True, "max_rows": 10000},
        "ip.reputation": {"allowed": True},
    },
    "protected_hosts": [],
}


def iso(time, host="lt-lab-9"):
    return {"id": "E", "time": time, "tool": "edr.isolate_host", "args": {"host": host}, "approved_by": "soc-lead"}


now = iso("2026-10-15T10:00:00Z", "lt-lab-50")
search = {"id": "S", "time": "2026-10-15T09:59:55Z", "tool": "siem.search", "args": {"rows": 10}}

full = [iso("2026-10-15T09:00:01Z"), iso("2026-10-15T09:59:50Z")]
assert check_action(policy, now, full) == "deny: rate limit", "two isolations 3,599 and 10 seconds earlier reach a limit of 2"

edge = [iso("2026-10-15T09:00:00Z"), iso("2026-10-15T09:00:01Z"), search]
assert check_action(policy, now, edge) == "allow", (
    "an isolation exactly 3,600 seconds earlier does not count, nor does another tool"
)

pending = dict(now)
del pending["approved_by"]
assert check_action(policy, pending, full) == "hold: needs approval by soc-lead", "the approval rule comes before the rate limit"

three = dict(policy, tools=dict(policy["tools"], **{"edr.isolate_host": {"allowed": True, "max_per_hour": 3}}))
assert check_action(three, now, full) == "allow", "max_per_hour comes from the policy: two earlier actions are under a limit of 3"
assert check_action(three, now, full + [iso("2026-10-15T09:30:00Z")]) == "deny: rate limit", "three earlier actions reach a limit of 3"

lookups = [{"id": f"L{n}", "time": "2026-10-15T09:59:00Z", "tool": "ip.reputation", "args": {}} for n in range(50)]
lookup = {"id": "L", "time": "2026-10-15T10:00:00Z", "tool": "ip.reputation", "args": {"ip": "192.0.2.1"}}
assert check_action(policy, lookup, lookups) == "allow", "a tool without max_per_hour has no rate limit"
