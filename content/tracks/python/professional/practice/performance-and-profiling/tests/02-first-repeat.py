# first_repeat: the first second scan, awkward input, and 300,000 scans within the time limit.
cases = [
    ([], None),
    (["P1"], None),
    (["P1", "P1"], "P1"),
    (["A", "B", "C", "B", "A"], "B"),
    (["A", "B", "A", "B"], "A"),
    (["x", "y", "z", "z", "y", "x"], "z"),
    (["colis-é", "colis-e", "colis-é"], "colis-é"),
    (["", "a", ""], ""),
]
for scans, expected in cases:
    got = first_repeat(scans)
    assert got == expected, f"first_repeat({scans!r}) should give the code whose second scan comes first"

scans = [f"P{n:06d}" for n in range(300_000)]
original = list(scans)
assert first_repeat(scans) is None, "300,000 different codes have no repeat"
scans.append("P123456")
assert first_repeat(scans) == "P123456", "a repeat at the very end of 300,001 scans"
assert scans[:-1] == original, "first_repeat should not change the list it is given"
