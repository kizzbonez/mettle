import pandas as pd

jobs = pd.DataFrame(
    {
        "job_id": ["W9", "W2", "W7", "W4", "W5"],
        "bike": ["recumbent", "hybrid", "gravel bike", "hybrid", "unicycle"],
        "part_code": ["MUD", "CHN", "MUD", "TYR", "SEAT-U"],
        "qty": [1, 1, 2, 2, 1],
    },
    index=["a", "b", "c", "d", "e"],
)
parts = pd.DataFrame({"code": ["CHN", "TYR"], "part": ["chain", "tyre"], "price": [11.0, 21.5]})
jobs_before, parts_before = jobs.copy(), parts.copy()

unknown = unknown_parts(jobs, parts)
assert isinstance(unknown, pd.DataFrame), "unknown_parts returns a DataFrame"
expected = pd.DataFrame(
    {
        "job_id": ["W5", "W7", "W9"],
        "bike": ["unicycle", "gravel bike", "recumbent"],
        "part_code": ["SEAT-U", "MUD", "MUD"],
        "qty": [1, 2, 1],
    }
)
check_frame(
    unknown,
    expected,
    "unknown_parts keeps every job with an unknown code, with the jobs' columns only, sorted by job_id, index 0, 1, 2, ...",
)
check_frame(jobs, jobs_before, "unknown_parts does not change jobs")
check_frame(parts, parts_before, "unknown_parts does not change parts")

none = unknown_parts(jobs[jobs["part_code"].isin(["CHN", "TYR"])], parts)
assert isinstance(none, pd.DataFrame) and len(none) == 0, "when every code is known the result has no rows"
assert none.columns.tolist() == ["job_id", "bike", "part_code", "qty"], "an empty result still has the jobs' columns"

everything = unknown_parts(jobs, parts.iloc[0:0])
assert everything["job_id"].tolist() == ["W2", "W4", "W5", "W7", "W9"], "with an empty parts list every job is unknown"
