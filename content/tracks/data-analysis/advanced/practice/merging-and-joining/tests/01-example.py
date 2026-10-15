import numpy as np
import pandas as pd

jobs = pd.read_csv("data/jobs.csv")
parts = pd.read_csv("data/parts.csv")

expected_priced = pd.DataFrame(
    {
        "job_id": ["J01", "J02", "J03", "J04", "J05", "J06", "J07"],
        "bike": ["Dutch city bike", "road bike", "mountain bike", "BMX", "folding bike", "child's bike", "Raleigh tourer"],
        "part_code": ["BRK-PAD", "TUB-700", "GRP-X", "CHN-1S", "BRK-PAD", "TUB-20", "TUB-26"],
        "qty": [4, 1, 2, 1, 2, 1, 2],
        "part": ["brake pads (pair)", "inner tube 700c", None, "single-speed chain", "brake pads (pair)", None, "inner tube 26in"],
        "price": [6.5, 5.25, np.nan, 12.0, 6.5, np.nan, 4.75],
        "cost": [26.0, 5.25, np.nan, 12.0, 13.0, np.nan, 9.5],
    }
)
check_frame(price_jobs(jobs, parts), expected_priced, "price_jobs of the example jobs and parts")

expected_unknown = pd.DataFrame(
    {
        "job_id": ["J03", "J06"],
        "bike": ["mountain bike", "child's bike"],
        "part_code": ["GRP-X", "TUB-20"],
        "qty": [2, 1],
    }
)
check_frame(unknown_parts(jobs, parts), expected_unknown, "unknown_parts of the example jobs and parts")

check_frame(parts_used(jobs, parts), parts.assign(used=[6, 1, 1, 2, 0]), "parts_used of the example jobs and parts")
