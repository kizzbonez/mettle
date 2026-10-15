# Merging by type and value ignoring case, ties on confidence, sources, ordering and an empty feed.
from pathlib import Path

Path("t4-feed.csv").write_text(
    "source,type,value,valid_until,confidence,likelihood,impact,tlp\n"
    "osint,domain,Login-Portal.example.net,2026-12-01,medium,low,high,TLP:CLEAR\n"
    "isac,domain,login-portal.example.net,2026-12-01,medium,high,high,TLP:GREEN\n"
    "vendor,domain,LOGIN-PORTAL.EXAMPLE.NET,2026-12-01,low,high,high,TLP:CLEAR\n"
    "osint,domain,login-portal.example.net,2026-12-01,medium,medium,low,TLP:CLEAR\n"
    "vendor,ipv4,198.51.100.5,2026-12-01,low,high,high,TLP:CLEAR\n"
    "isac,ipv4,198.51.100.5,2026-12-01,high,medium,medium,TLP:GREEN\n"
    "isac,IPv4,198.51.100.4,2026-12-01,high,medium,medium,TLP:GREEN\n"
    "isac,domain,cdn-sync.example.org,2026-12-01,high,medium,medium,TLP:GREEN\n"
    "vendor,sha256,c7a9845cdb61407c76521aa1bfc0f3add8dc96b88968656eaafe52a66ed7b30e,2026-12-01,High,Medium,Medium,TLP:CLEAR\n"
)

got = triage("t4-feed.csv", "2026-10-16")
by_value = {item["value"]: item for item in got}

portal = by_value.get("login-portal.example.net")
assert portal is not None, "values that differ only in case should be merged and returned in lower case"
assert portal["risk"] == "medium" and portal["confidence"] == "medium", (
    "on a tie in confidence, the first row in the file gives the likelihood and impact"
)
assert portal["sources"] == ["isac", "osint", "vendor"], "sources should be sorted and distinct, including less confident rows"

ip = by_value.get("198.51.100.5")
assert ip is not None and ip["confidence"] == "high" and ip["risk"] == "medium", (
    "the most confident row should win even when it comes later in the file"
)
assert ip["sources"] == ["isac", "vendor"], "sources of a merged IP"

assert [(item["type"], item["value"]) for item in got] == [
    ("domain", "cdn-sync.example.org"),
    ("ipv4", "198.51.100.4"),
    ("ipv4", "198.51.100.5"),
    ("sha256", "c7a9845cdb61407c76521aa1bfc0f3add8dc96b88968656eaafe52a66ed7b30e"),
    ("domain", "login-portal.example.net"),
], "order by risk, then confidence, then type, then value, with types in lower case"
assert by_value["c7a9845cdb61407c76521aa1bfc0f3add8dc96b88968656eaafe52a66ed7b30e"]["confidence"] == "high", (
    "confidence should be returned in lower case"
)

Path("t4-empty.csv").write_text("# nothing today\n\nsource,type,value,valid_until,confidence,likelihood,impact,tlp\n")
assert triage("t4-empty.csv", "2026-10-16") == [], "a feed with only a header should give an empty list"
