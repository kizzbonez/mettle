# hive_summary: gains from each hive's own first and last day, ties, band edges and which hives appear.
import numpy as np
import pandas as pd

BANDS = ["losing", "steady", "flow", "strong"]
nan = np.nan


def bands(*labels):
    return pd.Categorical(list(labels), categories=BANDS, ordered=True)


hives = read_hives("data/hives.csv", "data/apiaries.csv")
may = hive_summary(daily_weights(read_scales("data/scales-may.csv")), hives)
expected_may = pd.DataFrame({
    "colony": ["Clover", "Gorse", "Bramble", "Marigold", "Linden", "Sorrel", "Juniper"],
    "apiary": ["Pear Tree Orchard", "Ridgeway Heath", "Pear Tree Orchard", "Market Hall Roof",
               "Market Hall Roof", "Ridgeway Heath", "Pear Tree Orchard"],
    "gain_kg": [12.93, 10.23, 9.8, 4.93, 4.7, 2.47, -3.17],
    "best_3_days_kg": [2.86, 3.48, 2.17, 1.13, 1.88, 0.72, -0.4],
    "rank": [1, 2, 3, 4, 5, 6, 7],
    "band": bands("strong", "strong", "strong", "flow", "flow", "steady", "losing"),
}, index=pd.Index(["H01", "H04", "H02", "H07", "H06", "H05", "H03"], name="hive_id"))
check_frame(
    may,
    expected_may,
    "the May summary: registered hives with readings only, gains, best three days, rank and band",
    atol=0.011,
)

june = hive_summary(daily_weights(read_scales("data/scales-june.csv")), hives)
assert june.index.tolist() == ["H01", "H05", "H07", "H03"], (
    f"hives tied on gain are sorted by hive_id within their rank (got {june.index.tolist()})"
)
assert june["rank"].tolist() == [1, 1, 3, 4], f"tied hives share the better rank and the next rank skips (got {june['rank'].tolist()})"

register = pd.DataFrame({
    "hive_id": ["A7", "A6", "A5", "A4", "A3", "A2", "A1"],
    "colony": ["Gentian", "Fennel", "Elder", "Dock", "Cress", "Borage", "Aster"],
    "apiary": ["Test"] * 7,
    "site": ["test"] * 7,
})
dates = pd.date_range("2026-07-01", periods=6, freq="D", tz="Europe/London", name="date")
daily = pd.DataFrame({
    "A3": [40.0, 42.0, 44.5, 46.0, 47.0, 48.0],
    "A1": [nan, 30.0, 31.5, 29.0, 30.0, nan],
    "H99": [10.0] * 6,
    "A6": [10.0, 11.0, 11.0, 12.0, 12.5, 13.0],
    "A4": [35.0, 34.8, 34.9, 34.6, 34.5, 34.5],
    "A2": [20.0, 21.0, 21.5, 22.0, 22.5, 23.0],
    "A7": [15.0, 15.5, 16.0, 16.5, 17.5, 18.0],
}, index=dates)
daily.columns.name = "hive_id"
expected = pd.DataFrame({
    "colony": ["Cress", "Borage", "Fennel", "Gentian", "Aster", "Dock"],
    "apiary": ["Test"] * 6,
    "gain_kg": [8.0, 3.0, 3.0, 3.0, 0.0, -0.5],
    "best_3_days_kg": [6.0, 2.0, 2.0, 2.0, 0.0, -0.3],
    "rank": [1, 2, 2, 2, 5, 6],
    "band": bands("strong", "flow", "flow", "flow", "steady", "losing"),
}, index=pd.Index(["A3", "A2", "A6", "A7", "A1", "A4"], name="hive_id"))
check_frame(
    hive_summary(daily, register),
    expected,
    "gains use each hive's own first and last days with a value, bands include their lower edge, "
    "ties share a rank and are ordered by hive_id, and unregistered or silent hives are left out",
    atol=0.011,
)

nobody = hive_summary(daily[["H99"]], register)
assert len(nobody) == 0, "hive_summary is empty when no registered hive has daily weights"
assert list(nobody.columns) == ["colony", "apiary", "gain_kg", "best_3_days_kg", "rank", "band"], (
    "an empty summary still has the stated columns"
)
