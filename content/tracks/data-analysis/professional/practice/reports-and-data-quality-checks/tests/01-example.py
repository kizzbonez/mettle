from pathlib import Path

import pandas as pd

last_week = pd.read_csv("data/last-week.csv", parse_dates=["day"])
this_week = pd.read_csv("data/this-week.csv", parse_dates=["day"])

check_frame(
    visitor_table(this_week),
    pd.DataFrame(
        {
            "adult": [1965.0, 2342.0, 803.0, 4092.0, 9202.0],
            "child": [0.0, 860.0, 530.0, 0.0, 1390.0],
            "concession": [380.0, 215.0, 0.0, 410.0, 1005.0],
            "Total": [2345.0, 3417.0, 1333.0, 4502.0, 11597.0],
        },
        index=pd.Index(["Art", "Maritime", "Railway", "Science", "Total"], name="museum"),
    ).rename_axis(columns="ticket"),
    "visitor_table sums this week's visitors per museum and ticket, with totals",
)
assert batch_warnings(last_week, this_week) == [
    "row count 12 -> 15 (+25%)",
    "visitors: missing values up 13%",
    "museum: new value(s) Railway",
], "batch_warnings gives the example's three warnings, in order"

write_report("report.txt", last_week, this_week)
expected = (
    "Museum visitors, 2026-09-07 to 2026-09-08\n"
    "\n"
    "ticket   adult child concession  Total  share\n"
    "museum                                       \n"
    "Art      1,965     0        380  2,345  20.2%\n"
    "Maritime 2,342   860        215  3,417  29.5%\n"
    "Railway    803   530          0  1,333  11.5%\n"
    "Science  4,092     0        410  4,502  38.8%\n"
    "Total    9,202 1,390      1,005 11,597 100.0%\n"
    "\n"
    "Data checks:\n"
    "  - row count 12 -> 15 (+25%)\n"
    "  - visitors: missing values up 13%\n"
    "  - museum: new value(s) Railway\n"
)
assert Path("report.txt").read_text(encoding="utf-8") == expected, (
    "write_report writes the example report exactly as the instructions show"
)
