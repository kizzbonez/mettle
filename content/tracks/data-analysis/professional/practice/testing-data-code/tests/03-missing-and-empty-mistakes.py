# AttendanceTest must catch the mistakes that only missing statuses and empty registers show.
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


def missing_counted_as_present(register):
    return correct_attendance(register.fillna({"status": "present"}))


def missing_counted_in_sessions(register):
    result = correct_attendance(register)
    every_row = register.groupby("player")["status"].size()
    return result.assign(sessions=result["player"].map(every_row).astype("int64"))


def keeps_players_with_nothing_recorded(register):
    players = pd.DataFrame({"player": sorted(set(register["player"]))}).astype({"player": "str"})
    result = players.merge(correct_attendance(register), on="player", how="left")
    return result.fillna({"sessions": 0}).astype({"sessions": "int64"})


def empty_register_without_columns(register):
    if register.empty:
        return pd.DataFrame()
    return correct_attendance(register)


mistakes = {
    "counts a missing status as present": missing_counted_as_present,
    "counts the sessions with a missing status in sessions": missing_counted_in_sessions,
    "keeps a player whose every status is missing, with 0 sessions": keeps_players_with_nothing_recorded,
    "returns a frame without columns for an empty register": empty_register_without_columns,
}
for mistake, broken in mistakes.items():
    assert not run_tests(AttendanceTest, attendance=broken).wasSuccessful(), (
        f"AttendanceTest should fail when attendance {mistake}, but all its tests passed"
    )
