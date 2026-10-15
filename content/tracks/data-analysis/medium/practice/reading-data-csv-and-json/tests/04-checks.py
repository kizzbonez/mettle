from pathlib import Path

import numpy as np
import pandas as pd

Path("checks-may.jsonl").write_text(
    '{"bike_id": "0007", "member": "010", "checked_at": "2026-05-06 18:05", "brakes_ok": false, "tyre_mm": null}\n'
    '{"bike_id": "1200", "member": "250", "checked_at": "2026-05-06 19:30", "brakes_ok": true, "tyre_mm": 3.0}\n'
    '{"bike_id": "0080", "member": "001", "checked_at": "2026-05-13 18:15", "brakes_ok": true, "tyre_mm": 1.75}\n',
    encoding="utf-8",
)
checks = read_checks("checks-may.jsonl")
assert isinstance(checks, pd.DataFrame), "read_checks returns a DataFrame"
assert list(checks.columns) == ["bike_id", "member", "checked_at", "brakes_ok", "tyre_mm"], "read_checks keeps the five fields in order"
dtypes = {column: str(dtype) for column, dtype in checks.dtypes.items()}
assert dtypes == {
    "bike_id": "str",
    "member": "str",
    "checked_at": "datetime64[us]",
    "brakes_ok": "bool",
    "tyre_mm": "float64",
}, "each column of read_checks has the dtype in the instructions"
assert checks["bike_id"].tolist() == ["0007", "1200", "0080"], "bike ids stay text with their leading zeros"
assert checks["member"].tolist() == ["010", "250", "001"], "member numbers stay text with their leading zeros"
check_frame(
    checks["checked_at"],
    pd.Series(pd.to_datetime(["2026-05-06 18:05", "2026-05-06 19:30", "2026-05-13 18:15"]), name="checked_at"),
    "checked_at holds the date and time of each check",
)
check_frame(checks["tyre_mm"], pd.Series([np.nan, 3.0, 1.75], name="tyre_mm"), "a JSON null tyre reading is NaN")

Path("checks-one.jsonl").write_text(
    '{"bike_id": "0001", "member": "007", "checked_at": "2026-06-01 09:00", "brakes_ok": true, "tyre_mm": 2.0}\n',
    encoding="utf-8",
)
one = read_checks("checks-one.jsonl")
assert one.shape == (1, 5) and one["bike_id"].iloc[0] == "0001", "a file of one check gives one row"
