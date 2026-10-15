# The day of evidence in data/: every function, then the summary from the instructions.

ssh = ssh_attacks("data/auth.log")
assert isinstance(ssh, list), "ssh_attacks returns a list"
assert [(r["ip"], r["kind"]) for r in ssh] == [
    ("198.51.100.23", "brute-force"),
    ("203.0.113.77", "password-spraying"),
], f"ssh_attacks finds one brute-force and one spraying source, in order (got {[(r['ip'], r['kind']) for r in ssh]})"
assert ssh[0] == {"ip": "198.51.100.23", "kind": "brute-force", "failures": 16, "accounts": 2, "accepted": []}, (
    f"brute-force result counts only 'Failed ... ssh2' lines, including invalid users (got {ssh[0]})"
)
assert ssh[1] == {"ip": "203.0.113.77", "kind": "password-spraying", "failures": 8, "accounts": 7,
                  "accepted": ["h.dlamini"]}, f"spraying result matches the worked example (got {ssh[1]})"

travel = impossible_travel("data/signins.csv")
assert travel == [
    {"user": "h.dlamini", "from_city": "Southampton", "to_city": "Johannesburg",
     "from_time": "2026-10-14T08:20:44Z", "to_time": "2026-10-14T13:10:52Z", "km": 9049, "hours": 4.84},
    {"user": "s.moreau", "from_city": "London", "to_city": "Singapore",
     "from_time": "2026-10-14T07:58:03Z", "to_time": "2026-10-14T09:31:28Z", "km": 10848, "hours": 1.56},
], f"impossible_travel flags the two pairs of the example, sorted by user (got {travel})"

probes = web_probes("data/access.log")
assert [p["kind"] for p in probes] == ["traversal"] * 4 + ["injection"] * 5, (
    f"web_probes finds 4 traversal then 5 injection requests in file order (got {[p['kind'] for p in probes]})"
)
assert probes[2] == {"time": "14/Oct/2026:07:22:18 +0000", "ip": "198.51.100.61", "kind": "traversal",
                     "status": 200, "target": "/download?file=..%252f..%252f..%252fetc%252fpasswd"}, (
    f"the double-encoded traversal probe matches the worked example (got {probes[2]})"
)

hits = ioc_matches("data/processes.csv", "data/iocs.csv")
assert [(h["host"], h["match"]) for h in hits] == [
    ("rcp-ws-14", "sha256"), ("rcp-ws-22", "domain"), ("rcp-ws-22", "ipv4"),
    ("xray-ws-31", "domain"), ("srv-booking", "sha256"),
], f"ioc_matches finds five processes, in file order (got {[(h['host'], h['match']) for h in hits]})"

expected = [
    "SSH brute-force: 198.51.100.23 (16 failures, 2 accounts)",
    "SSH password-spraying: 203.0.113.77 (8 failures, 7 accounts); accepted: h.dlamini",
    "Impossible travel: h.dlamini Southampton -> Johannesburg (9049 km in 4.84 h)",
    "Impossible travel: s.moreau London -> Singapore (10848 km in 1.56 h)",
    "Web probes: 9 (4 traversal, 5 injection) from 3 IPs, 3 answered 200",
    "IoC sha256: rcp-ws-14 C:\\Users\\s.moreau\\AppData\\Local\\Temp\\svchost.exe "
    "(d1421388e30984358e50cf78be90dc21382412e414e71188b55542d6197f3f0b)",
    "IoC domain: rcp-ws-22 C:\\Windows\\System32\\certutil.exe (cdn-update.example.net)",
    "IoC ipv4: rcp-ws-22 C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe (203.0.113.77)",
    "IoC domain: xray-ws-31 C:\\Windows\\System32\\cmd.exe (sync.example.org)",
    "IoC sha256: srv-booking /tmp/.X11-unix/.cache/kworkerd "
    "(b3bcdf55fa2ccd99e9ef8d4a0aa630afff573b1f665c402bcc395057fff7b014)",
]
lines = report("data")
assert isinstance(lines, list), "report returns a list of lines"
for i, (got, want) in enumerate(zip(lines, expected), 1):
    assert got == want, f"report line {i} matches the worked example\n  got:  {got}\n  want: {want}"
assert len(lines) == len(expected), f"report has {len(expected)} lines (got {len(lines)})"
