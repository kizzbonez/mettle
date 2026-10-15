# The May export from the instructions, from the readings to the first rows of the summary.
import pandas as pd

BANDS = ["losing", "steady", "flow", "strong"]

readings = read_scales("data/scales-may.csv")
assert isinstance(readings, pd.DataFrame), "read_scales returns a DataFrame"
assert list(readings.columns) == ["time", "hive_id", "weight_kg"], (
    f"read_scales has the columns time, hive_id and weight_kg, in that order (got {list(readings.columns)})"
)
assert len(readings) == 404, f"read_scales keeps one row per usable reading of the May file (got {len(readings)} rows)"
assert str(readings["time"].dtype) == "datetime64[us, Europe/London]", (
    f"time is converted from UTC to Europe/London (got dtype {readings['time'].dtype})"
)
first_four = pd.DataFrame({
    "time": pd.to_datetime(["2026-05-01 06:30", "2026-05-01 12:30", "2026-05-01 18:30",
                            "2026-05-02 00:30"]).tz_localize("Europe/London"),
    "hive_id": ["H01", "H01", "H01", "H01"],
    "weight_kg": [34.5, 34.2, 34.7, 35.8],
})
check_frame(readings.head(4), first_four, "the first four readings are H01's, on local time, as in the example")

hives = read_hives("data/hives.csv", "data/apiaries.csv")
assert hives["hive_id"].tolist() == ["H01", "H02", "H03", "H04", "H05", "H06", "H07", "H08"], (
    f"read_hives cleans the hive ids and sorts by them (got {hives['hive_id'].tolist()})"
)

unknown = unknown_scales(readings, hives)
expected_unknown = pd.Series([51], index=pd.Index(["H09"], name="hive_id"), name="readings")
check_frame(unknown, expected_unknown, "unknown_scales counts the readings of the scale that is not in the register")

daily = daily_weights(readings)
assert daily.shape == (15, 8), f"daily_weights has one row per local date, 1 to 15 May, and one column per scale (got {daily.shape})"
dates = pd.date_range("2026-05-01", periods=3, freq="D", tz="Europe/London", name="date")
check_frame(
    daily["H01"].iloc[:3],
    pd.Series([34.47, 35.58, 36.45], index=dates, name="H01"),
    "the first three daily means of H01, indexed by local midnight and named date",
    check_freq=False,
    atol=0.011,
)
assert daily.iloc[9].isna().all(), "the row for 10 May, when the gateway was down, is present and all missing"

summary = hive_summary(daily, hives)
top = pd.DataFrame({
    "colony": ["Clover", "Gorse", "Bramble"],
    "apiary": ["Pear Tree Orchard", "Ridgeway Heath", "Pear Tree Orchard"],
    "gain_kg": [12.93, 10.23, 9.80],
    "best_3_days_kg": [2.86, 3.48, 2.17],
    "rank": [1, 2, 3],
    "band": pd.Categorical(["strong", "strong", "strong"], categories=BANDS, ordered=True),
}, index=pd.Index(["H01", "H04", "H02"], name="hive_id"))
assert len(summary) == 7, f"hive_summary has a row for each registered hive with daily weights (got {len(summary)} rows)"
check_frame(summary.head(3), top, "the first three rows of the May summary match the example", atol=0.011)
