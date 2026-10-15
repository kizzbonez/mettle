import numpy as np
import pandas as pd

jobs = pd.DataFrame(
    {
        "job_id": ["K30", "K10", "K25", "K20", "K15"],
        "bike": ["tandem", "tricycle", "e-bike", "tandem", "cargo bike"],
        "part_code": ["SPK", "BEL", "SPK", "XYZ", "SPK"],
        "qty": [12, 1, 3, 1, 2],
    },
    index=[9, 3, 7, 1, 5],
)
parts = pd.DataFrame(
    {
        "code": ["BEL", "SPK", "SAD", "LGT"],
        "part": ["bell", "spoke", "saddle", "light set"],
        "price": [4.0, 0.333, 18.0, 15.5],
    }
)
jobs_before, parts_before = jobs.copy(), parts.copy()

priced = price_jobs(jobs, parts)
assert isinstance(priced, pd.DataFrame), "price_jobs returns a DataFrame"
assert len(priced) == len(jobs), "price_jobs keeps one row per job, matched or not"
assert priced.columns.tolist() == ["job_id", "bike", "part_code", "qty", "part", "price", "cost"], (
    "price_jobs has the jobs' columns, then part, price and cost, and no code column"
)
expected = pd.DataFrame(
    {
        "job_id": ["K10", "K15", "K20", "K25", "K30"],
        "bike": ["tricycle", "cargo bike", "tandem", "e-bike", "tandem"],
        "part_code": ["BEL", "SPK", "XYZ", "SPK", "SPK"],
        "qty": [1, 2, 1, 3, 12],
        "part": ["bell", "spoke", None, "spoke", "spoke"],
        "price": [4.0, 0.333, np.nan, 0.333, 0.333],
        "cost": [4.0, 0.67, np.nan, 1.0, 4.0],
    }
)
check_frame(
    priced,
    expected,
    "price_jobs keeps unmatched jobs, sorts by job_id with the index 0, 1, 2, ... and rounds cost to 2 decimals",
)
check_frame(jobs, jobs_before, "price_jobs does not change jobs")
check_frame(parts, parts_before, "price_jobs does not change parts")

doubled = pd.concat([parts, pd.DataFrame({"code": ["SAD"], "part": ["gel saddle"], "price": [24.0]})], ignore_index=True)
try:
    price_jobs(jobs, doubled)
except pd.errors.MergeError:
    pass
else:
    raise AssertionError("price_jobs raises MergeError when the parts list names a code twice")
