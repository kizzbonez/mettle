# The example from the instructions.
blocklist = load_blocklist("data/blocklist.txt")
assert isinstance(blocklist, set), "load_blocklist should return a set"
assert "pssw0rd" in blocklist and "correcthorsebatterystaple" in blocklist, (
    "load_blocklist should fold each entry of data/blocklist.txt, as fold('P@ssw0rd') gives 'pssw0rd'"
)
assert len(blocklist) == 11, f"data/blocklist.txt has 11 passwords besides comments and blank lines, got {len(blocklist)}"

cases = [
    ("P@ssw0rd!", "jsmith", False, ["TOO-SHORT", "BLOCKLISTED"]),
    ("P@ssw0rd!", "jsmith", True, ["BLOCKLISTED"]),
    ("Correct Horse Battery Staple", "aoki", False, ["BLOCKLISTED"]),
    ("dbrennan-matchday-2026", "dbrennan", False, ["CONTEXT"]),
    ("Rovers till I die 1987", "kpatel", False, ["CONTEXT"]),
    ("lantern walrus quietly 47", "lmensah", False, []),
]
for password, username, mfa, want in cases:
    got = check_password(password, username, mfa, blocklist)
    assert got == want, f"check_password({password!r}, {username!r}, {mfa}, blocklist): got {got!r}"
