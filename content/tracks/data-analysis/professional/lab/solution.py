"""airwatch: validate, store and report the classroom CO2 readings of Brookfield School."""
import argparse
import logging
import sys
from pathlib import Path

import numpy as np
import pandas as pd

logger = logging.getLogger("airwatch")

READING_COLUMNS = ["sensor", "time", "co2_ppm", "temp_c"]
TIME_FORMAT = "%Y-%m-%d %H:%M"
HIGH_PPM = 1500


def load_readings(paths):
    """Read the reading files as text and stack them, with the file name and line number of each row."""
    frames = []
    for path in map(Path, paths):
        raw = pd.read_csv(path, dtype=str, keep_default_na=False)
        missing = [column for column in READING_COLUMNS if column not in raw.columns]
        if missing:
            raise ValueError(f"{path.name} has no column {', '.join(missing)}")
        raw = raw[READING_COLUMNS]
        raw.insert(0, "line", np.arange(2, len(raw) + 2))
        raw.insert(0, "file", path.name)
        frames.append(raw)
    return pd.concat(frames, ignore_index=True)


def validate(raw, rooms):
    """Split the raw rows into (clean, quarantine) by the rules in the instructions."""
    sensor = raw["sensor"].str.strip().str.upper()
    time = pd.to_datetime(raw["time"].str.strip(), format=TIME_FORMAT, errors="coerce")
    co2 = pd.to_numeric(raw["co2_ppm"].str.strip(), errors="coerce")
    temp_text = raw["temp_c"].str.strip()
    temp = pd.to_numeric(temp_text, errors="coerce")

    rules = {
        "unknown sensor": ~sensor.isin(rooms["sensor"]),
        "bad time": time.isna(),
        "bad co2": ~(co2.between(300, 5000) & (co2 % 1 == 0)),
        "bad temperature": (temp_text != "") & ~temp.between(0, 40),
    }
    reason = pd.Series(np.select(list(rules.values()), list(rules), default=""), index=raw.index)
    passed = reason == ""
    keys = pd.DataFrame({"sensor": sensor, "time": time})
    repeated = keys[passed].duplicated().reindex(raw.index, fill_value=False)
    reason[repeated] = "duplicate"

    ok = reason == ""
    clean = (
        pd.DataFrame({"sensor": sensor, "time": time, "co2_ppm": co2, "temp_c": temp})[ok]
        .astype({"co2_ppm": "int64"})
        .merge(rooms[["sensor", "room"]], on="sensor", how="left", validate="many_to_one")
        [["sensor", "room", "time", "co2_ppm", "temp_c"]]
        .sort_values(["sensor", "time"], kind="stable", ignore_index=True)
    )
    quarantine = raw[~ok].assign(reason=reason[~ok]).reset_index(drop=True)
    return clean, quarantine


def summarise(clean):
    """One row per room and day: readings, mean and max CO2, high readings, mean temperature."""
    daily = (
        clean.assign(date=clean["time"].dt.normalize(), high=clean["co2_ppm"] >= HIGH_PPM)
        .groupby(["date", "room"], as_index=False)
        .agg(
            readings=("co2_ppm", "size"),
            mean_co2=("co2_ppm", "mean"),
            max_co2=("co2_ppm", "max"),
            high=("high", "sum"),
            mean_temp=("temp_c", "mean"),
        )
    )
    return daily.round({"mean_co2": 1, "mean_temp": 1})


def report(clean, quarantine, daily):
    """The text report: row counts, quarantined rows by reason, and the worst room of each day."""
    read = len(clean) + len(quarantine)
    lines = [
        "Air quality report",
        f"Rows read: {read}",
        f"Rows kept: {len(clean)} ({100 * len(clean) / read:.1f}%)",
        f"Rows quarantined: {len(quarantine)}",
    ]
    for reason, count in quarantine["reason"].value_counts().sort_index().items():
        lines.append(f"  {reason}: {count}")
    lines.append("Worst room each day:")
    worst = daily.sort_values(["date", "max_co2", "room"], ascending=[True, False, True]).drop_duplicates("date")
    for row in worst.itertuples(index=False):
        lines.append(
            f"  {row.date:%Y-%m-%d} {row.room}: max {row.max_co2} ppm, {row.high} of {row.readings} readings high"
        )
    return "\n".join(lines) + "\n"


def build_parser():
    parser = argparse.ArgumentParser(prog="airwatch", description=__doc__)
    parser.add_argument("files", nargs="+", help="reading CSV files, in order")
    parser.add_argument("--rooms", default="data/rooms.csv", help="sensor to room CSV file")
    parser.add_argument("--out", default="out", help="folder for the outputs (default: out)")
    return parser


def main(argv=None):
    args = build_parser().parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    try:
        rooms = pd.read_csv(args.rooms, dtype=str)
        raw = load_readings(args.files)
    except (OSError, ValueError) as error:
        logger.error("%s", error)
        return 1
    logger.info("read %d rows from %d files", len(raw), len(args.files))
    clean, quarantine = validate(raw, rooms)
    logger.info("kept %d rows, quarantined %d", len(clean), len(quarantine))
    if clean.empty:
        logger.error("no valid readings")
        return 1
    daily = summarise(clean)
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    clean.to_parquet(out / "readings.parquet", index=False)
    daily.to_parquet(out / "daily.parquet", index=False)
    quarantine.to_csv(out / "quarantine.csv", index=False)
    text = report(clean, quarantine, daily)
    (out / "report.txt").write_text(text, encoding="utf-8")
    logger.info("wrote 4 files to %s", out)
    print(text, end="")
    return 0


if __name__ == "__main__":
    sys.exit(main())
