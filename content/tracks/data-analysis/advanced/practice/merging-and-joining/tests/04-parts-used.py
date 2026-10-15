import pandas as pd

parts = pd.DataFrame(
    {
        "code": ["PED", "GRP", "BEL", "KST"],
        "part": ["pedals", "grips", "bell", "kickstand"],
        "price": [14.0, 7.5, 4.0, 9.0],
    },
    index=["p4", "p1", "p3", "p2"],
)
jobs = pd.DataFrame(
    {
        "job_id": ["T1", "T2", "T3", "T4", "T5", "T6"],
        "bike": ["city bike"] * 6,
        "part_code": ["GRP", "PED", "GRP", "ZZZ", "GRP", "PED"],
        "qty": [2, 1, 2, 7, 1, 2],
    }
)
jobs_before, parts_before = jobs.copy(), parts.copy()

used = parts_used(jobs, parts)
assert isinstance(used, pd.DataFrame), "parts_used returns a DataFrame"
check_frame(
    used,
    parts.assign(used=[3, 5, 0, 0]),
    "parts_used adds the total qty per part to the parts list, 0 for a part never used, keeping its rows, order and labels",
)
check_frame(jobs, jobs_before, "parts_used does not change jobs")
check_frame(parts, parts_before, "parts_used does not change parts")

check_frame(
    parts_used(jobs.iloc[0:0], parts),
    parts.assign(used=[0, 0, 0, 0]),
    "with no jobs every part is used 0 times",
)
