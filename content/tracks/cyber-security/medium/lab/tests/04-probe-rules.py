# The probe rules on a log built for the test: decoding, both kinds, precedence, skipped lines.
import tempfile
from pathlib import Path

AGENT = '"-" "Mozilla/5.0"'
ENTRIES = [  # (ip, target, status) in file order; None as target writes a malformed request line
    ("192.0.2.1", "/img/a..b/logo.png", 200),                                # dots, no slash: not a probe
    ("192.0.2.2", "/%2e%2e/%2e%2e/etc/shadow", 403),                         # traversal, encoded dots
    ("192.0.2.2", "/get?f=%252e%252e%252f%252e%252e%252fboot.ini", 200),    # traversal, double-encoded
    ("192.0.2.3", "/get?f=..%5C..%5Cweb.config", 404),                       # traversal, encoded backslash
    ("192.0.2.4", "/list?id=7%27+OR+1%3D1", 500),                            # injection, + for spaces
    ("192.0.2.4", "/list?id=7+UNION+SELECT+card+FROM+pay", 500),             # injection, upper case
    ("192.0.2.4", "/p?n=%3CSCRIPT%3Ealert(1)%3C/SCRIPT%3E", 200),            # injection, upper-case tag
    ("192.0.2.5", "/q?a=%2524%257Bjndi%253Adns%253A%252F%252Fx.example%257D", 404),  # injection, double-encoded
    ("192.0.2.6", "/get?f=../../x%27%20or%20%271%27%3D%271", 400),           # both: traversal wins
    ("192.0.2.7", "/search?q=or+else", 200),                                 # 'or' without a quote
    ("192.0.2.7", "/search?q=o%27reilly", 200),                              # a quote but not ' or
    ("192.0.2.8", None, 408),                                                # "-" request
    ("192.0.2.9", "/old", 200),                                              # two-word request line
]
lines = []
for i, (ip, target, status) in enumerate(ENTRIES):
    if target is None:
        request = "-"
    elif target == "/old":
        request = "GET /old"
    else:
        request = f"GET {target} HTTP/1.1"
    lines.append(f'{ip} - - [15/Oct/2026:10:{i:02d}:00 +0000] "{request}" {status} 512 {AGENT}')
folder = Path(tempfile.mkdtemp())
(folder / "access.log").write_text("\n".join(lines) + "\n")

got = web_probes(folder / "access.log")
assert isinstance(got, list), "web_probes returns a list"
targets = [g.get("target") for g in got]
assert "/img/a..b/logo.png" not in targets, "two dots without a slash or backslash are not traversal"
assert "/search?q=or+else" not in targets and "/search?q=o%27reilly" not in targets, (
    "'or' without a preceding quote, and a quote without ' or ', are not injection"
)
assert "/old" not in targets, "a request line that is not three words is skipped"
assert "/get?f=%252e%252e%252f%252e%252e%252fboot.ini" in targets, "targets are decoded twice (double encoding)"
assert "/get?f=..%5C..%5Cweb.config" in targets, "an encoded backslash after two dots is traversal"
assert "/list?id=7%27+OR+1%3D1" in targets, "+ decodes to a space, and matching ignores case"
assert "/q?a=%2524%257Bjndi%253Adns%253A%252F%252Fx.example%257D" in targets, "a double-encoded ${jndi: is injection"
kinds = {g["target"]: g["kind"] for g in got}
assert kinds.get("/get?f=../../x%27%20or%20%271%27%3D%271") == "traversal", (
    "a request with both traversal and injection markers is traversal"
)
assert [g["kind"] for g in got] == ["traversal"] * 3 + ["injection"] * 4 + ["traversal"], (
    "probes are reported in file order with the right kind"
)
assert got[0] == {"time": "15/Oct/2026:10:01:00 +0000", "ip": "192.0.2.2", "kind": "traversal",
                  "status": 403, "target": "/%2e%2e/%2e%2e/etc/shadow"}, (
    "each probe has the bracketed time, the IP, the kind, the status as an int and the raw target"
)

(folder / "empty.log").write_text("")
assert web_probes(folder / "empty.log") == [], "an empty log gives an empty list"
