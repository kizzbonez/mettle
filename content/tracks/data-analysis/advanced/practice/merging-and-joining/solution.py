"""Bike Workshop Parts: price the repair jobs from the parts list."""

import pandas as pd


def price_jobs(jobs, parts):
    """Every job with its part's name, price and cost; one parts row per code is enforced."""
    priced = jobs.merge(
        parts,
        how="left",
        left_on="part_code",
        right_on="code",
        validate="many_to_one",
    )
    priced = priced.drop(columns="code").assign(cost=(priced["qty"] * priced["price"]).round(2))
    return priced.sort_values("job_id").reset_index(drop=True)


def unknown_parts(jobs, parts):
    """The jobs whose part_code is not in the parts list, with the jobs' columns only."""
    unknown = jobs.merge(parts, how="left_anti", left_on="part_code", right_on="code")
    return unknown[jobs.columns].sort_values("job_id").reset_index(drop=True)


def parts_used(jobs, parts):
    """The parts list with a column used: the total qty of each part over all jobs."""
    used = jobs.groupby("part_code")["qty"].sum().rename("used")
    joined = parts.join(used, on="code")
    return joined.assign(used=joined["used"].fillna(0).astype("int64"))
