# AttendanceTest must pass on the correct attendance and fail on each broken one.
import io
import sys
import unittest
from unittest import mock

import numpy as np
import pandas as pd

solution_module = sys.modules["solution"]


def correct_attendance(register):
    taken = register.dropna(subset=["status"])
    return (
        taken.assign(present=taken["status"] == "present")
        .groupby("player", as_index=False)
        .agg(sessions=("present", "size"), rate=("present", "mean"))
    )


def correct_sprint_scores(seconds):
    seconds = np.asarray(seconds, dtype=float)
    if np.isnan(seconds).all():
        return np.full(seconds.shape, np.nan)
    return np.nanmin(seconds) / seconds


def run_tests(case, **replacements):
    """Run one of the learner's TestCase classes with the functions swapped; return the result."""
    functions = {"attendance": correct_attendance, "sprint_scores": correct_sprint_scores}
    functions.update(replacements)
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(case)
    with mock.patch.multiple(solution_module, **functions):
        return unittest.TextTestRunner(stream=io.StringIO(), verbosity=0).run(suite)


assert run_tests(AttendanceTest).wasSuccessful(), "every test in AttendanceTest should pass on the correct attendance"


def rate_rounded(register):
    result = correct_attendance(register)
    return result.assign(rate=result["rate"].round(2))


def sessions_as_floats(register):
    return correct_attendance(register).astype({"sessions": "float64"})


def rows_in_order_of_appearance(register):
    taken = register.dropna(subset=["status"])
    return (
        taken.assign(present=taken["status"] == "present")
        .groupby("player", as_index=False, sort=False)
        .agg(sessions=("present", "size"), rate=("present", "mean"))
    )


def sorted_without_new_index(register):
    return rows_in_order_of_appearance(register).sort_values("player")


mistakes = {
    "rounds the rate to 2 decimals": rate_rounded,
    "returns sessions as float64": sessions_as_floats,
    "lists the players in the order they first appear": rows_in_order_of_appearance,
    "sorts the players but keeps the old index labels": sorted_without_new_index,
}
for mistake, broken in mistakes.items():
    assert not run_tests(AttendanceTest, attendance=broken).wasSuccessful(), (
        f"AttendanceTest should fail when attendance {mistake}, but all its tests passed"
    )
