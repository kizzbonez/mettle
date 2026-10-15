import pandas as pd

keys = [
    ("Tarn", "2026-09"),
    ("Abbey", "2026-10"),
    ("Kyle", "2026-11"),
    ("Abbey", "2026-09"),
    ("Tarn", "2026-11"),
    ("Kyle", "2026-09"),
    ("Dale", "2026-10"),
    ("Kyle", "2026-10"),
    ("Dale", "2026-12"),
]
table = pd.DataFrame(
    {"nights": [8, 1, 4, 6, 2, 9, 3, 5, 7], "stays": [3, 1, 2, 2, 1, 4, 1, 2, 3]},
    index=pd.MultiIndex.from_tuples(keys, names=["hostel", "month"]),
)
before = table.copy()


def rows(*wanted):
    return table.loc[list(wanted)]


result = window(table, "Abbey", "Kyle", "2026-10", "2026-11")
assert isinstance(result, pd.DataFrame), "window returns a DataFrame"
check_frame(
    result,
    rows(("Abbey", "2026-10"), ("Dale", "2026-10"), ("Kyle", "2026-10"), ("Kyle", "2026-11")),
    "window works on a table in any order and returns the rows sorted, both ends included",
)
check_frame(table, before, "window does not change the table")

check_frame(
    window(table, "B", "M", "2026-01", "2026-09"),
    rows(("Kyle", "2026-09")),
    "the ends of the ranges need not be labels of the table",
)
check_frame(
    window(table, "Tarn", "Tarn", "2026-09", "2026-12"),
    rows(("Tarn", "2026-09"), ("Tarn", "2026-11")),
    "a range of one hostel",
)
none = window(table, "Abbey", "Tarn", "2027-01", "2027-03")
assert isinstance(none, pd.DataFrame) and len(none) == 0, "a range of months with no bookings gives no rows"
assert none.columns.tolist() == ["nights", "stays"], "an empty result still has the table's columns"
