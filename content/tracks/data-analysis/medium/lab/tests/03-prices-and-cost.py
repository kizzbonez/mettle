# load_prices and add_cost: prices from the JSON file, cost rules, and an input left unchanged.
import numpy as np
import pandas as pd

prices = load_prices("data/sites.json")
assert isinstance(prices, pd.Series), "load_prices returns a Series"
assert prices.name == "price_per_kwh" and prices.index.name == "code", (
    "the prices Series is named price_per_kwh and its index is named code"
)
assert prices.index.tolist() == ["MKT", "STN", "LEI", "HSP", "PKR"], "every site of the JSON file is kept, in file order"

mar = load_sessions("data/sessions-mar.csv")
before = mar.copy()
priced = add_cost(mar, prices)
assert priced is not mar, "add_cost returns a new DataFrame"
check_frame(mar, before, "add_cost leaves the frame it is given unchanged (no new column, no changed value)")
assert list(priced.columns) == list(mar.columns) + ["cost"], "add_cost keeps every column and adds cost at the end"
check_frame(priced.drop(columns=["cost"]), before, "add_cost does not change the other columns")
check_frame(
    priced["cost"],
    pd.Series([7.80, 8.82, 11.52, 0.0, 11.31, 1.53, 10.29, np.nan, 6.66, 0.0, 13.59, np.nan], name="cost"),
    "cost is kwh times the site's price rounded to 2 decimals, 0.0 for a fault, missing when kwh is missing",
)

other = pd.Series({"MKT": 1.0, "STN": 2.0, "LEI": 0.5, "HSP": 0.25}, name="price_per_kwh")
check_frame(
    add_cost(mar, other)["cost"],
    pd.Series([10.0, 4.5, 51.2, 0.0, 14.5, 6.8, 5.25, np.nan, 29.6, 0.0, 60.4, np.nan], name="cost"),
    "add_cost uses the prices it is given, not prices written into the code",
)

feb = add_cost(load_sessions("data/sessions-feb.csv"), prices)
faults = feb.loc[feb["status"] == "fault", "cost"]
assert len(faults) == 2 and (faults == 0.0).all(), "every fault session costs 0.0, even when its kwh is missing"
aborted = feb.loc[feb["session_id"] == "S2607", "cost"].iloc[0]
assert aborted == 2.72, "an aborted session is charged for the energy it delivered"
assert pd.isna(feb.loc[feb["session_id"] == "S2619", "cost"].iloc[0]), (
    "a session that is not a fault and has no kwh has a missing cost, not 0"
)
