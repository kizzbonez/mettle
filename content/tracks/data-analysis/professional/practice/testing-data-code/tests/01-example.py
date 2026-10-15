# Your tests must pass on the correct functions and catch the two broken versions from the instructions.
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


for name in ["AttendanceTest", "SprintScoresTest"]:
    assert isinstance(globals().get(name), type) and issubclass(globals()[name], unittest.TestCase), (
        f"solution.py should define the class {name} as a subclass of unittest.TestCase"
    )

for case in [AttendanceTest, SprintScoresTest]:
    result = run_tests(case)
    problems = [str(test) for test, _ in result.failures + result.errors]
    assert result.wasSuccessful(), (
        f"every test in {case.__name__} should pass on the correct functions; these did not: {problems}"
    )


def missing_counted_as_absent(register):
    return (
        register.assign(present=register["status"] == "present")
        .groupby("player", as_index=False)
        .agg(sessions=("present", "size"), rate=("present", "mean"))
    )


def scores_upside_down(seconds):
    seconds = np.asarray(seconds, dtype=float)
    if np.isnan(seconds).all():
        return np.full(seconds.shape, np.nan)
    return seconds / np.nanmin(seconds)


assert not run_tests(AttendanceTest, attendance=missing_counted_as_absent).wasSuccessful(), (
    "AttendanceTest should fail when attendance counts a missing status as absent, but all its tests passed"
)
assert not run_tests(SprintScoresTest, sprint_scores=scores_upside_down).wasSuccessful(), (
    "SprintScoresTest should fail when sprint_scores divides each time by the best instead of the best by "
    "each time, but all its tests passed"
)
