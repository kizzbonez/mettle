# The February export from the instructions: clean it, price it and summarise it per site.
import pandas as pd

feb = load_sessions("data/sessions-feb.csv")
assert isinstance(feb, pd.DataFrame), "load_sessions returns a DataFrame"
assert list(feb.columns) == ["session_id", "site", "connector", "started", "kwh", "minutes", "status"], (
    f"load_sessions keeps the file's seven columns in order (got {list(feb.columns)})"
)
assert len(feb) == 64, f"load_sessions reads every session of the February file, and not the title line (got {len(feb)} rows)"
dtypes = {column: str(dtype) for column, dtype in feb.dtypes.items()}
assert dtypes == {
    "session_id": "str",
    "site": "str",
    "connector": "category",
    "started": "datetime64[us]",
    "kwh": "float64",
    "minutes": "Int64",
    "status": "str",
}, f"each column has the dtype the instructions give (got {dtypes})"
assert sorted(feb["site"].unique()) == ["HSP", "LEI", "MKT", "STN"], (
    f"site holds only the four upper-case codes (got {sorted(feb['site'].unique())})"
)
assert pd.isna(feb.loc[18, "kwh"]) and pd.isna(feb.loc[19, "kwh"]), "a kwh of '-' or an empty field is missing (NaN)"
assert pd.isna(feb.loc[10, "minutes"]) and pd.isna(feb.loc[40, "minutes"]), "minutes that are not a number are missing"
assert feb.loc[0, "minutes"] == 135, "minutes that are numbers are kept"

prices = load_prices("data/sites.json")
check_frame(
    prices,
    pd.Series(
        [0.52, 0.45, 0.39, 0.49, 0.42],
        index=pd.Index(["MKT", "STN", "LEI", "HSP", "PKR"], name="code"),
        name="price_per_kwh",
    ),
    "load_prices returns the price per kWh of every site, indexed by code",
)

priced = add_cost(feb, prices)
assert priced.loc[0, "cost"] == 5.67, f"cost of S2601: 14.53 kWh at 0.39 a kWh, rounded to 2 decimals (got {priced.loc[0, 'cost']!r})"

expected = pd.DataFrame(
    {
        "site": ["STN", "MKT", "HSP", "LEI"],
        "sessions": [20, 16, 12, 16],
        "energy_kwh": [298.1, 238.2, 163.5, 130.8],
        "revenue": [133.80, 123.83, 80.14, 51.04],
        "avg_minutes": pd.array([65.8, 77.8, 79.5, 95.0], dtype="Float64"),
        "faults": [2, 0, 0, 0],
    }
)
check_frame(site_summary(priced), expected, "site_summary of the priced February sessions matches the worked example")
