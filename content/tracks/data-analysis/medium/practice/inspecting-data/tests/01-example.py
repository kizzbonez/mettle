import pandas as pd

loans = pd.read_csv("data/loans.csv")

check_frame(
    missing_counts(loans),
    pd.Series([0, 0, 1, 1, 0, 2], index=["loan_id", "branch", "item", "days_out", "renewals", "borrower_age"]),
    "missing_counts of the loans export",
)

branch = category_report(loans["branch"])
assert branch == {"distinct": 4, "missing": 0, "top": "Central", "top_share": 0.5}, "category_report of the branch column"
item = category_report(loans["item"])
assert set(item) == {"distinct", "missing", "top", "top_share"}, "category_report returns the four keys"
assert item["distinct"] == 3 and item["missing"] == 1 and item["top"] == "book", "category_report of the item column"
assert abs(item["top_share"] - 0.636) < 1e-9, "top_share of the item column, rounded to 3 decimals"

sample = spot_check(loans, 3, seed=4)
assert sample["loan_id"].tolist() == ["L004", "L005", "L007"], "spot_check(loans, 3, seed=4), as in the example"
assert sample.index.tolist() == [3, 4, 6], "spot_check keeps the rows' index labels"

expected = pd.DataFrame(
    {
        "days_out": [11.0, 16.18, 8.96, 3.0, 14.0, 14.0, 17.5, 35.0],
        "renewals": [12.0, 0.92, 1.38, 0.0, 0.0, 0.0, 1.25, 4.0],
        "borrower_age": [10.0, 41.6, 18.34, 15.0, 30.25, 39.5, 50.0, 73.0],
    },
    index=["count", "mean", "std", "min", "25%", "50%", "75%", "max"],
)
check_frame(numeric_summary(loans), expected, "numeric_summary of the loans export")
