# SprintScoresTest must pass on the correct sprint_scores and fail on each broken one.
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


assert run_tests(SprintScoresTest).wasSuccessful(), (
    "every test in SprintScoresTest should pass on the correct sprint_scores"
)


def best_found_with_min(seconds):
    seconds = np.asarray(seconds, dtype=float)
    return seconds.min() / seconds


def scores_rounded(seconds):
    return np.round(correct_sprint_scores(seconds), 2)


def missing_scores_zero(seconds):
    return np.nan_to_num(correct_sprint_scores(seconds))


def fails_when_every_time_is_missing(seconds):
    seconds = np.asarray(seconds, dtype=float)
    return seconds[~np.isnan(seconds)].min() / seconds


def overwrites_the_times(seconds):
    best = np.nanmin(seconds)
    np.divide(best, seconds, out=seconds)
    return seconds


mistakes = {
    "finds the best time with min, so one missing time makes every score NaN": best_found_with_min,
    "rounds the scores to 2 decimals": scores_rounded,
    "scores a missing time 0 instead of NaN": missing_scores_zero,
    "raises an error when every time is missing": fails_when_every_time_is_missing,
    "writes the scores into the array it was given": overwrites_the_times,
}
with np.errstate(all="ignore"):
    for mistake, broken in mistakes.items():
        assert not run_tests(SprintScoresTest, sprint_scores=broken).wasSuccessful(), (
            f"SprintScoresTest should fail when sprint_scores {mistake}, but all its tests passed"
        )
