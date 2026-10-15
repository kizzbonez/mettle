import pandas as pd

last_week = pd.read_csv("data/last-week.csv", parse_dates=["day"])
before = last_week.copy()

table = visitor_table(last_week)
check_frame(
    table,
    pd.DataFrame(
        {
            "adult": [1805, 2405, 3960, 8170],
            "child": [0, 790, 5995, 6785],
            "concession": [310, 240, 395, 945],
            "Total": [2115, 3435, 10350, 15900],
        },
        index=pd.Index(["Art", "Maritime", "Science", "Total"], name="museum"),
    ).rename_axis(columns="ticket"),
    "visitor_table gives int64 counts without gaps, 0 for a ticket a museum did not sell, and totals",
)
check_frame(last_week, before, "visitor_table does not change the visits")
assert render(table) == (
    "ticket   adult child concession  Total  share\n"
    "museum                                       \n"
    "Art      1,805     0        310  2,115  13.3%\n"
    "Maritime 2,405   790        240  3,435  21.6%\n"
    "Science  3,960 5,995        395 10,350  65.1%\n"
    "Total    8,170 6,785        945 15,900 100.0%"
), "render formats last week's counts with thousands separators and adds the shares"

visits = pd.DataFrame({
    "day": pd.to_datetime(["2026-09-14", "2026-09-14", "2026-09-15", "2026-09-20"]),
    "museum": ["Musée Rodin", "Musée Rodin", "Zoo", "Zoo"],
    "ticket": ["adult", "child", "adult", "adult"],
    "visitors": [1_234_567, 89, 5, 3],
})
table = visitor_table(visits)
assert table.loc["Zoo", "adult"] == 8 and table.loc["Total", "Total"] == 1_234_664, (
    "visitor_table adds up several days of one museum and ticket, and the grand total"
)
shown = table.copy()
assert render(table) == (
    "ticket          adult child     Total  share\n"
    "museum                                      \n"
    "Musée Rodin 1,234,567    89 1,234,656 100.0%\n"
    "Zoo                 8     0         8   0.0%\n"
    "Total       1,234,575    89 1,234,664 100.0%"
), "render writes millions with separators and shares with one decimal"
check_frame(table, shown, "render does not change the table it is given")
