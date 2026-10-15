import pandas as pd

raw = pd.read_csv("data/donations.csv")
tidy = tidy_names(raw)
assert tidy.columns.tolist() == ["donor_name", "item_type", "weight_g", "date"], "tidy_names of the example file's columns"

weights = pd.DataFrame({"item": ["a", "b", "c"], "kg": [0.5, 1.0, 2.5]})
check_frame(drop_small(weights, 1.0), weights.iloc[[1, 2]], "drop_small(weights, 1.0) keeps kg of 1.0 and more")

expected = pd.DataFrame(
    {"donations": [2, 2, 1, 1], "total_kg": [7.0, 6.8, 1.5, 1.25]},
    index=pd.Index(["rice", "tins", "pasta", "cereal"], name="item_type"),
)
check_frame(report("data/donations.csv", 1.0), expected, "report('data/donations.csv', 1.0)")
