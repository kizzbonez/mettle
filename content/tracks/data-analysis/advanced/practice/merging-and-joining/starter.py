"""Bike Workshop Parts: price the repair jobs from the parts list.

jobs has the columns job_id, bike, part_code and qty; parts has code, part and price.
Every `raise NotImplementedError` marks code you still have to write. Use merge, the anti
joins and join: no loops over rows.
"""

import pandas as pd


def price_jobs(jobs, parts):
    """Every job with its part's name, price and cost; one parts row per code is enforced."""
    # The key is part_code in jobs and code in parts. validate= makes a duplicated code fail.
    raise NotImplementedError


def unknown_parts(jobs, parts):
    """The jobs whose part_code is not in the parts list, with the jobs' columns only."""
    raise NotImplementedError


def parts_used(jobs, parts):
    """The parts list with a column used: the total qty of each part over all jobs."""
    raise NotImplementedError
