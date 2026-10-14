# smallest_gap: unsorted input, repeats, negatives, too few times, the list left alone, and 200,000 times.
cases = [
    ([], None),
    ([600], None),
    ([600, 600], 0),
    ([900, 300], 600),
    ([5, -3, 12, -10], 7),
    ([1440, 0, 720, 719, 1], 1),
    ([30, 90, 60, 60, 120], 0),
]
for times, expected in cases:
    copy = list(times)
    got = smallest_gap(times)
    assert got == expected, f"smallest_gap({copy!r}) should be the smallest difference between two of the times"
    assert times == copy, f"smallest_gap should not change the list it is given ({copy!r})"

times = list(range(1_999_990, -1, -10))   # 200,000 departures, 10 minutes apart, newest first
times.insert(100_000, 1_234_563)
copy = list(times)
assert smallest_gap(times) == 3, "the smallest gap among 200,001 departure times"
assert times == copy, "smallest_gap should not change the list of 200,001 times"
