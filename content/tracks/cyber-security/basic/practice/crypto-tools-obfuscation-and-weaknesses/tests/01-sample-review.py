# The example from the instructions.
expected = {
    "video-gateway": [],
    "records-api": ["WEAK-CIPHER", "WEAK-HASH"],
    "pharmacy-link": ["WEAK-CIPHER", "SHORT-KEY", "WEAK-HASH", "DOWNGRADE-RISK"],
    "reset-tokens": ["POOR-RANDOMNESS", "HARDCODED-KEY"],
}
for service in load_services("data/services.json"):
    got = weak_settings(service)
    assert got == expected[service["name"]], f"weak_settings for {service['name']} in data/services.json: got {got!r}"

got = reused_nonces("data/encrypt.log")
assert got == [
    ("k-2026-10", "9f1c2a7b3e4d5c6b7a8f9e0d"),
    ("k-2026-11", "000000000000000000000000"),
    ("k-2026-11", "000000000000000000000001"),
], f"reused_nonces for data/encrypt.log: got {got!r}"
