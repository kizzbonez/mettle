# The example from the instructions.
reviewed = {"permissions": ["storage", "scripting"], "host_permissions": ["https://claims.ashdown.example/*"]}
update = {"permissions": ["storage", "scripting", "cookies"],
          "host_permissions": ["https://claims.ashdown.example/*", "*://*/*"]}
assert new_permissions(update, reviewed) == ["*://*/*", "cookies"], (
    "new_permissions should list what the update adds, sorted"
)

expected = [
    ("ash-lt-014", "kdlmgifhpcbjnegpaeoijbfhbmplcnek", "compromised", "3.8.1"),
    ("ash-lt-021", "hmjkmjkepdijhoojdojkdfohbdgmmhki", "unapproved", "PDF Quick Convert"),
    ("ash-lt-033", "oafchlnmbedjgbfkeipniaocgimhedfn", "new-permissions", "*://*/*,cookies"),
]
got = audit("data/extensions.json", "data/allowlist.json", "data/advisory.csv")
if got != expected:
    print("audit(...) returned:")
    for row in got:
        print("  ", row)
assert got == expected, "audit of the files in data/ should match the example in the instructions"
