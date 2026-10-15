import pandas as pd

bookings = pd.read_csv("data/bookings.csv")

keys = [
    ("Coastal", "2026-06"),
    ("Coastal", "2026-07"),
    ("Coastal", "2026-08"),
    ("Glen", "2026-06"),
    ("Glen", "2026-07"),
    ("Glen", "2026-08"),
    ("Harbour", "2026-07"),
    ("Harbour", "2026-08"),
    ("Moor", "2026-06"),
    ("Moor", "2026-07"),
]
expected_table = pd.DataFrame(
    {"nights": [2, 7, 3, 1, 3, 7, 6, 5, 3, 6], "stays": [1, 2, 1, 1, 1, 1, 2, 1, 1, 2]},
    index=pd.MultiIndex.from_tuples(keys, names=["hostel", "month"]),
)
table = monthly_table(bookings)
check_frame(table, expected_table, "monthly_table of the example bookings")

check_frame(
    window(expected_table, "Glen", "Moor", "2026-07", "2026-08"),
    expected_table.iloc[[4, 5, 6, 7, 9]],
    "window(table, 'Glen', 'Moor', '2026-07', '2026-08')",
)

check_frame(
    month_ranking(expected_table, "2026-07"),
    pd.Series([7, 6, 6, 3], index=pd.Index(["Coastal", "Harbour", "Moor", "Glen"], name="hostel"), name="nights"),
    "month_ranking(table, '2026-07')",
)

expected_flat = pd.DataFrame(
    {
        "hostel": ["Coastal", "Glen", "Harbour", "Moor"],
        "2026-06": [2, 1, 0, 3],
        "2026-07": [7, 3, 6, 6],
        "2026-08": [3, 7, 5, 0],
    }
)
check_frame(flat(expected_table), expected_flat, "flat(table) of the example bookings", check_names=False)
