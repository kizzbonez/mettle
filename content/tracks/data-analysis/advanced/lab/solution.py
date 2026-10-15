"""Hive Scale Season Report: join the scale gateway's export to the hive register and report the nectar flow."""

import numpy as np
import pandas as pd

LOCAL_ZONE = "Europe/London"
BANDS = ["losing", "steady", "flow", "strong"]


def read_scales(path):
    """Return one row per usable reading: time (local), hive_id and weight_kg."""
    wide = pd.read_csv(path)
    long = wide.melt(id_vars="time_utc", var_name="hive_id", value_name="weight_kg")
    long["weight_kg"] = pd.to_numeric(long["weight_kg"], errors="coerce")
    long["time"] = pd.to_datetime(long["time_utc"], utc=True).dt.tz_convert(LOCAL_ZONE)
    return (
        long.dropna(subset=["weight_kg"])
        .loc[:, ["time", "hive_id", "weight_kg"]]
        .sort_values(["hive_id", "time"])
        .reset_index(drop=True)
    )


def read_hives(hives_path, apiaries_path):
    """Return the hive register joined to its apiaries, one row per hive."""
    hives = pd.read_csv(hives_path)
    apiaries = pd.read_csv(apiaries_path)
    hives["hive_id"] = hives["hive_id"].str.strip().str.upper()
    joined = hives.merge(apiaries, on="apiary_id", how="left", validate="many_to_one")
    return (
        joined.rename(columns={"name": "apiary"})
        .loc[:, ["hive_id", "colony", "apiary", "site"]]
        .sort_values("hive_id")
        .reset_index(drop=True)
    )


def unknown_scales(readings, hives):
    """Count the readings of every scale that is not in the hive register."""
    stray = readings.merge(hives[["hive_id"]], on="hive_id", how="left_anti")
    return stray.groupby("hive_id").size().rename("readings")


def daily_weights(readings):
    """Mean weight of each hive on each local day, one row per date, one column per hive."""
    daily = readings.pivot_table(
        index=pd.Grouper(key="time", freq="D"),
        columns="hive_id",
        values="weight_kg",
        aggfunc="mean",
    )
    return daily.asfreq("D").rename_axis("date").round(2)


def hive_summary(daily, hives):
    """Gain, best three days, rank and band of every registered hive that has daily weights."""
    first = daily.bfill().iloc[0]
    last = daily.ffill().iloc[-1]
    gains = pd.DataFrame({
        "gain_kg": (last - first).round(2),
        "best_3_days_kg": daily.diff(3).max().round(2),
    })
    summary = hives.set_index("hive_id")[["colony", "apiary"]].join(gains, how="inner")
    summary["rank"] = summary["gain_kg"].rank(ascending=False, method="min").astype("int64")
    summary["band"] = pd.cut(
        summary["gain_kg"], bins=[-np.inf, 0, 3, 8, np.inf], labels=BANDS, right=False
    )
    return summary.sort_values(["rank", "hive_id"])
