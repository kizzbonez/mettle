import pandas as pd

runs = pd.DataFrame(
    {
        "runner": ["Zoe", "Ali", "Zoe", "Zoe", "Ali", "Mei", "Zoe"],
        "week": ["W05", "W04", "W05", "W04", "W06", "W06", "W05"],
        "km": [1.04, 10.0, 2.03, 6.0, 4.5, 12.3, 3.0],
    }
)
before = runs.copy()
result = weekly_totals(runs)
assert isinstance(result, pd.DataFrame), "weekly_totals returns a DataFrame"
expected = pd.DataFrame(
    {
        "W04": [10.0, 0.0, 6.0, 16.0],
        "W05": [0.0, 0.0, 6.1, 6.1],
        "W06": [4.5, 12.3, 0.0, 16.8],
        "All": [14.5, 12.3, 12.1, 38.9],
    },
    index=pd.Index(["Ali", "Mei", "Zoe", "All"], name="runner"),
)
expected.columns.name = "week"
check_frame(
    result,
    expected,
    "weekly_totals sums repeated runner and week pairs, fills 0, adds All totals, sorts and rounds to 1 decimal",
)
check_frame(runs, before, "weekly_totals does not change the runs")

single = pd.DataFrame({"runner": ["Sol"], "week": ["W01"], "km": [5.0]})
expected_single = pd.DataFrame({"W01": [5.0, 5.0], "All": [5.0, 5.0]}, index=pd.Index(["Sol", "All"], name="runner"))
expected_single.columns.name = "week"
check_frame(weekly_totals(single), expected_single, "a log of a single run")
