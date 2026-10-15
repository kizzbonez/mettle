import pandas as pd

keys = [
    ("Yarrow", "2026-04"),
    ("Pike", "2026-05"),
    ("Yarrow", "2026-05"),
    ("Esk", "2026-05"),
    ("Linn", "2026-05"),
    ("Esk", "2026-04"),
    ("Brae", "2026-05"),
]
table = pd.DataFrame(
    {"nights": [4, 6, 6, 2, 6, 5, 1], "stays": [1, 2, 3, 1, 2, 2, 1]},
    index=pd.MultiIndex.from_tuples(keys, names=["hostel", "month"]),
)
before = table.copy()

ranking = month_ranking(table, "2026-05")
assert isinstance(ranking, pd.Series), "month_ranking returns a Series"
check_frame(
    ranking,
    pd.Series([6, 6, 6, 2, 1], index=pd.Index(["Linn", "Pike", "Yarrow", "Esk", "Brae"], name="hostel"), name="nights"),
    "month_ranking lists the month's hostels, most nights first and ties in hostel order",
)
check_frame(
    month_ranking(table, "2026-04"),
    pd.Series([5, 4], index=pd.Index(["Esk", "Yarrow"], name="hostel"), name="nights"),
    "month_ranking selects on the month level",
)

wide = flat(table)
assert isinstance(wide, pd.DataFrame), "flat returns a DataFrame"
expected = pd.DataFrame(
    {
        "hostel": ["Brae", "Esk", "Linn", "Pike", "Yarrow"],
        "2026-04": [0, 5, 0, 0, 4],
        "2026-05": [1, 2, 6, 6, 6],
    }
)
check_frame(
    wide,
    expected,
    "flat gives one row per hostel, sorted, a column of nights per month with 0 where none, and the index 0, 1, 2, ...",
    check_names=False,
)
check_frame(table, before, "month_ranking and flat do not change the table")
