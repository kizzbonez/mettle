# Expiry on the boundary, TLP labels in any case, and filtering before merging.
from pathlib import Path

Path("t3-feed.csv").write_text(
    "# test feed\n"
    "source,type,value,valid_until,confidence,likelihood,impact,tlp\n"
    "\n"
    "a,ipv4,192.0.2.10,2026-10-16,low,low,low,TLP:CLEAR\n"
    "a,ipv4,192.0.2.11,2026-10-15,high,high,high,TLP:CLEAR\n"
    "b,ipv4,192.0.2.12,2027-03-01,medium,low,high, tlp:green \n"
    "b,domain,update-check.example.com,2026-12-01,high,high,medium,TLP:Amber\n"
    "c,domain,relay.example.com,2026-12-01,high,high,high,TLP:AMBER+STRICT\n"
    "c,domain,relay2.example.com,2026-12-01,high,high,high,tlp:red\n"
    "# a comment between rows\n"
    "c,ipv4,192.0.2.13,2026-12-01,high,high,high,TLP:AMBER+STRICT\n"
    "d,ipv4,192.0.2.13,2026-12-01,low,low,medium,TLP:GREEN\n"
    "c,ipv4,192.0.2.14,2026-10-01,high,high,high,TLP:CLEAR\n"
    "d,ipv4,192.0.2.14,2026-11-01,low,low,medium,TLP:CLEAR\n"
)

got = triage("t3-feed.csv", "2026-10-16")
values = [item["value"] for item in got]
assert "192.0.2.10" in values, "an indicator valid until today should be kept"
assert "192.0.2.11" not in values, "an indicator that expired yesterday should be dropped"
assert "192.0.2.12" in values, "TLP labels should be compared ignoring case and spaces (tlp:green)"
assert "update-check.example.com" in values, "TLP:Amber is TLP:AMBER and may be shared"
assert "relay.example.com" not in values, "TLP:AMBER+STRICT must not go to the shared SIEM"
assert "relay2.example.com" not in values, "TLP:RED must not go to the shared SIEM"

by_value = {item["value"]: item for item in got}
item = by_value.get("192.0.2.13")
assert item is not None, "a shareable copy of an indicator should be kept when another copy is TLP:AMBER+STRICT"
assert item["sources"] == ["d"] and item["confidence"] == "low" and item["risk"] == "low", (
    "rows dropped for their TLP should not take part in the merge"
)
item = by_value.get("192.0.2.14")
assert item is not None and item["sources"] == ["d"] and item["risk"] == "low", (
    "expired rows should not take part in the merge"
)

assert got == [
    {"type": "domain", "value": "update-check.example.com", "risk": "high", "confidence": "high", "sources": ["b"]},
    {"type": "ipv4", "value": "192.0.2.12", "risk": "medium", "confidence": "medium", "sources": ["b"]},
    {"type": "ipv4", "value": "192.0.2.10", "risk": "low", "confidence": "low", "sources": ["a"]},
    {"type": "ipv4", "value": "192.0.2.13", "risk": "low", "confidence": "low", "sources": ["d"]},
    {"type": "ipv4", "value": "192.0.2.14", "risk": "low", "confidence": "low", "sources": ["d"]},
], "the whole result for a feed with expired and restricted rows"
