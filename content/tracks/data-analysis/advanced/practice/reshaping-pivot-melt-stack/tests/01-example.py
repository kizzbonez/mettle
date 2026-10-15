import pandas as pd

sheet = pd.read_csv("data/sheet.csv")
expected_long = pd.DataFrame(
    {
        "runner": ["Ade", "Ade", "Bea", "Bea", "Bea", "Dee", "Dee"],
        "week": ["W01", "W03", "W01", "W02", "W03", "W01", "W02"],
        "km": [12.5, 8.0, 5.0, 6.5, 7.0, 21.0, 18.25],
    }
)
check_frame(sheet_to_long(sheet), expected_long, "sheet_to_long of the example sheet")

runs = pd.read_csv("data/runs.csv")
expected_totals = pd.DataFrame(
    {
        "W01": [16.5, 5.0, 0.0, 21.5],
        "W02": [0.0, 6.5, 10.0, 16.5],
        "W03": [8.0, 0.0, 0.0, 8.0],
        "All": [24.5, 11.5, 10.0, 46.0],
    },
    index=pd.Index(["Ade", "Bea", "Dee", "All"], name="runner"),
)
expected_totals.columns.name = "week"
check_frame(weekly_totals(runs), expected_totals, "weekly_totals of the example runs")

orders = pd.DataFrame(
    {
        "member": ["Ade", "Bea", "Cal", "Dee"],
        "size": ["M", "S", "L", "M"],
        "kit": [["vest", "socks"], ["vest"], [], ["socks", "socks", "cap"]],
    }
)
expected_kit = pd.DataFrame(
    {"M": [1, 3, 1], "S": [0, 0, 1]},
    index=pd.Index(["cap", "socks", "vest"], name="kit"),
)
expected_kit.columns.name = "size"
check_frame(kit_table(orders), expected_kit, "kit_table of the example orders")
