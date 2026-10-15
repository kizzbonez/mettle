# The example from the instructions.
got = mfa_fatigue("data/mfa.csv")
assert got == [("d.hale", "approved-after-fatigue"), ("t.oduya", "fatigue")], (
    f"mfa_fatigue('data/mfa.csv') should match the example in the instructions, not {got!r}"
)
got = concurrent_sessions("data/sessions.csv")
assert got == [("d.hale", "S-0998", "S-1001"), ("r.singh", "S-1010", "S-1011")], (
    f"concurrent_sessions('data/sessions.csv') should match the example in the instructions, not {got!r}"
)
