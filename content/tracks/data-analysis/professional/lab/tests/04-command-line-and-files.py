# The program: the files it writes, what it prints, and its exit status when the input is bad.
from pathlib import Path

import pandas as pd

FILES = ["data/readings-2026-03-02.csv", "data/readings-2026-03-03.csv"]
EXPECTED_REPORT = """Air quality report
Rows read: 134
Rows kept: 122 (91.0%)
Rows quarantined: 12
  bad co2: 3
  bad temperature: 2
  bad time: 2
  duplicate: 3
  unknown sensor: 2
Worst room each day:
  2026-03-02 Music room: max 1866 ppm, 4 of 12 readings high
  2026-03-03 Science lab: max 1934 ppm, 5 of 12 readings high
"""

ran = run_script(args=[*FILES, "--out", "results/march"])
assert ran.code == 0, f"the program exits with status 0 on good input, not {ran.code}"
assert ran.out == EXPECTED_REPORT, "standard output carries the report and nothing else"
assert "Traceback" not in ran.err, "a successful run prints no traceback"
assert "INFO: " in ran.err, "the program logs its steps at INFO level to standard error"

out = Path("results/march")
for name in ["readings.parquet", "daily.parquet", "quarantine.csv", "report.txt"]:
    assert (out / name).is_file(), f"the program writes {name} into the --out folder, creating it when needed"
assert (out / "report.txt").read_text(encoding="utf-8") == EXPECTED_REPORT, "report.txt holds the report"

rooms = pd.read_csv("data/rooms.csv", dtype=str)
clean, quarantine = validate(load_readings(FILES), rooms)
check_frame(
    pd.read_parquet(out / "readings.parquet"),
    clean,
    "readings.parquet reads back as the clean frame, with the same columns, dtypes and a plain index",
)
check_frame(
    pd.read_parquet(out / "daily.parquet"),
    summarise(clean),
    "daily.parquet reads back as the daily summary, with the same columns, dtypes and a plain index",
)
check_frame(
    pd.read_csv(out / "quarantine.csv", dtype=str, keep_default_na=False),
    quarantine.astype({"line": "str"}),
    "quarantine.csv holds the quarantined rows and their reasons, without the index",
)

ran = run_script(args=["data/readings-broken.csv", "--out", "broken-out"])
assert ran.code == 1, f"a file without the required columns exits with status 1, not {ran.code}"
assert ran.out == "", "a failed run prints nothing on standard output"
assert "ERROR: " in ran.err and "Traceback" not in ran.err, "a failed run logs an ERROR line, not a traceback"
assert not Path("broken-out").exists() or not any(Path("broken-out").iterdir()), "a failed run writes no files"

for args, what in [
    (["data/no-such-file.csv", "--out", "missing-out"], "a reading file that does not exist"),
    (["data/readings-2026-03-02.csv", "--rooms", "data/no-rooms.csv", "--out", "missing-out"],
     "a rooms file that does not exist"),
    (["data/readings-empty.csv", "--out", "missing-out"], "a file with no valid readings"),
]:
    status = main(args)
    assert status == 1, f"main returns 1 for {what}, not {status!r}"
    assert not Path("missing-out").exists() or not any(Path("missing-out").iterdir()), (
        f"nothing is written for {what}"
    )

try:
    main([])
except SystemExit as stop:
    assert stop.code == 2, f"running without a FILE is a usage error with status 2, not {stop.code!r}"
else:
    raise AssertionError("running without a FILE is a usage error: argparse exits with status 2")
