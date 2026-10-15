import hashlib
import json
import platform
from pathlib import Path

import numpy as np
import pandas as pd
import pyarrow

pupils = pd.DataFrame({
    "name": ["Zoe", "Yusuf", "Xia", "Will"],
    "class": ["6B", "6A", "6B", "6A"],
    "books": [12, 12, 30, 12],
    "minutes": [725, 725, 1801, 724],
    "last_read": pd.to_datetime(
        ["2026-08-01 23:59:59", "2026-08-02 00:00:01", "2026-07-31 12:00:00", "2026-08-02 00:00:00"]
    ),
}).astype({"last_read": "datetime64[us]"})
folder = Path("archive") / "summer-2026"


def fingerprint(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


write_results(pupils, str(folder))
csv = folder / "leaderboard.csv"
assert csv.is_file() and (folder / "versions.json").is_file(), (
    "write_results creates the folder, with missing parents, and writes both files"
)
assert csv.read_bytes() == (
    b"rank,name,class,books,hours,last_read\n"
    b"1,Xia,6B,30,30.02,2026-07-31\n"
    b"2,Yusuf,6A,12,12.08,2026-08-02\n"
    b"3,Zoe,6B,12,12.08,2026-08-01\n"
    b"4,Will,6A,12,12.07,2026-08-02\n"
), "leaderboard.csv has 2 decimals for hours, dates without times, no index and \\n line endings"
first = fingerprint(csv)

csv.write_text("stale\n" * 50, encoding="utf-8")
write_results(pupils.iloc[[3, 1, 0, 2]], folder)
assert fingerprint(csv) == first, (
    "a second run, with the rows in another order, replaces the file with the very same bytes"
)

recorded = json.loads((folder / "versions.json").read_text(encoding="utf-8"))
assert recorded == {
    "python": platform.python_version(),
    "numpy": np.__version__,
    "pandas": pd.__version__,
    "pyarrow": pyarrow.__version__,
}, "versions.json records the versions in use"
assert (folder / "versions.json").read_text(encoding="utf-8") == json.dumps(recorded) + "\n", (
    "versions.json holds json.dumps(versions()) and a newline"
)
assert versions() == recorded, "versions() returns the versions in use"
