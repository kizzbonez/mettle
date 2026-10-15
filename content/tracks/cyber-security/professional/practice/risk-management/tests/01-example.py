# The example from the instructions.
assert rate(3, 5) == (15, "H"), f"rate(3, 5) should be (15, 'H'), not {rate(3, 5)!r}"
assert rate(4, 4) == (16, "C"), f"rate(4, 4) should be (16, 'C'), not {rate(4, 4)!r}"

value = control_value(900_000, 0.40, 0.25, 0.10, 0.10, 30_000)
assert value == 51000.0, f"control_value for the lesson's ransomware control should be 51000.0, not {value!r}"

got = check_register("data/register.json")
expected = [
    "ACCEPT-TOO-HIGH R-05 (score 16)",
    "NEEDS-BOARD R-05 (ALE 300000.00)",
    "NO-OWNER R-06",
    "UNSIGNED R-06",
    "NOT-WORTH R-07 (value -7500.00)",
    "BAD-TREATMENT R-08 (ignore)",
    "UNSIGNED R-09",
]
assert got == expected, f"check_register('data/register.json') should be {expected!r}, not {got!r}"
