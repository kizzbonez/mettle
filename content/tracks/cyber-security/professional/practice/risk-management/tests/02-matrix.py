# rate: every cell of the five-by-five matrix, and values that are not whole numbers from 1 to 5.
matrix = {
    5: "M H H C C",
    4: "L M H C C",
    3: "L M M H H",
    2: "L L M M H",
    1: "L L L L M",
}
for likelihood, row in matrix.items():
    for impact, band in enumerate(row.split(), 1):
        got = rate(likelihood, impact)
        assert got == (likelihood * impact, band), (
            f"rate({likelihood}, {impact}) should give the score and band of the lesson's matrix"
        )

for bad in [(0, 3), (3, 0), (6, 1), (1, 6), (-2, 4), (2.5, 2), (3, "4")]:
    try:
        rate(*bad)
    except ValueError:
        continue
    raise AssertionError(f"rate{bad} should raise ValueError: both values must be ints from 1 to 5")
