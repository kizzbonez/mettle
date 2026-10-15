import pandas as pd

bookings = pd.DataFrame(
    {
        "hostel": ["Wold", "Bay", "Wold", "Bay", "Wold", "Bay", "Wold"],
        "month": ["2027-01", "2026-12", "2026-12", "2026-12", "2027-01", "2027-02", "2027-01"],
        "nights": [2, 5, 1, 0, 4, 3, 1],
    },
    index=[70, 60, 50, 40, 30, 20, 10],
)
before = bookings.copy()
table = monthly_table(bookings)
assert isinstance(table, pd.DataFrame), "monthly_table returns a DataFrame"
assert isinstance(table.index, pd.MultiIndex), "monthly_table has a MultiIndex"
assert list(table.index.names) == ["hostel", "month"], "the levels are named hostel and month, in that order"
expected = pd.DataFrame(
    {"nights": [5, 3, 1, 7], "stays": [2, 1, 1, 3]},
    index=pd.MultiIndex.from_tuples(
        [("Bay", "2026-12"), ("Bay", "2027-02"), ("Wold", "2026-12"), ("Wold", "2027-01")],
        names=["hostel", "month"],
    ),
)
check_frame(
    table,
    expected,
    "monthly_table sums nights and counts every booking, a booking of 0 nights included, sorted by hostel then month",
)
check_frame(bookings, before, "monthly_table does not change the bookings")

single = monthly_table(pd.DataFrame({"hostel": ["Fell"], "month": ["2026-05"], "nights": [9]}))
check_frame(
    single,
    pd.DataFrame(
        {"nights": [9], "stays": [1]},
        index=pd.MultiIndex.from_tuples([("Fell", "2026-05")], names=["hostel", "month"]),
    ),
    "a single booking",
)
