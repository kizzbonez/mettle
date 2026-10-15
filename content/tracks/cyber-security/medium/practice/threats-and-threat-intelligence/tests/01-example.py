# The example from the instructions.
HASH = "1af88ef16853520916342ae92a206241d252487b7cf957bb77525896e5b5a06f"

assert risk(" High", "MEDIUM") == "high", "risk(' High', 'MEDIUM') should read the matrix ignoring case and spaces"

expected = [
    {"type": "ipv4", "value": "203.0.113.66", "risk": "critical", "confidence": "high",
     "sources": ["cisa-ais", "waterisac"]},
    {"type": "domain", "value": "scada-update.example.net", "risk": "high", "confidence": "high",
     "sources": ["internal", "kestrel-intel"]},
    {"type": "sha256", "value": HASH, "risk": "medium", "confidence": "high",
     "sources": ["internal"]},
    {"type": "ipv4", "value": "192.0.2.144", "risk": "medium", "confidence": "low",
     "sources": ["kestrel-intel"]},
    {"type": "ipv4", "value": "198.51.100.77", "risk": "low", "confidence": "medium",
     "sources": ["kestrel-intel"]},
    {"type": "domain", "value": "hmi-portal.example.org", "risk": "low", "confidence": "low",
     "sources": ["cisa-ais"]},
]
got = triage("data/feed.csv", "2026-10-16")
assert isinstance(got, list), "triage should return a list of dicts"
if got != expected:
    print("triage('data/feed.csv', '2026-10-16') returned:")
    for item in got:
        print("  ", item)
assert got == expected, "triage of data/feed.csv on 2026-10-16 should match the example in the instructions"
