"""Training Register: the junior football club's figures, and the tests that protect them."""
import unittest

import numpy as np
import pandas as pd
import pandas.testing as pdt


def attendance(register):
    """One row per player: the sessions recorded and the share of them the player attended.

    REGISTER has the columns player and status (str): "present", "absent", or missing when no
    register was taken. Missing statuses are left out. Returns the columns player, sessions
    (int64) and rate (float64, not rounded), one row per player with at least one recorded
    session, sorted by player, with the index 0 to n-1.
    """
    taken = register.dropna(subset=["status"])
    return (
        taken.assign(present=taken["status"] == "present")
        .groupby("player", as_index=False)
        .agg(sessions=("present", "size"), rate=("present", "mean"))
    )


def sprint_scores(seconds):
    """Score each 40 m sprint time against the best one: best / time, so the fastest scores 1.0.

    SECONDS is a 1-D float array, NaN where a player did not run. A missing time scores NaN and is
    ignored when finding the best; when every time is missing, every score is NaN. Returns a new
    float array (not rounded) and leaves SECONDS unchanged.
    """
    seconds = np.asarray(seconds, dtype=float)
    if np.isnan(seconds).all():
        return np.full(seconds.shape, np.nan)
    return np.nanmin(seconds) / seconds


def make(rows):
    """A small register from (player, status) tuples; None is a missing status."""
    return pd.DataFrame(rows, columns=["player", "status"]).astype({"player": "str", "status": "str"})


# Do not change the code above: write tests for it below.


class AttendanceTest(unittest.TestCase):
    def test_rate_per_player(self):
        register = make([("Ben", "present"), ("Ben", "absent"), ("Cy", "present")])
        expected = pd.DataFrame({"player": ["Ben", "Cy"], "sessions": [2, 1], "rate": [0.5, 1.0]})
        pdt.assert_frame_equal(attendance(register), expected)

    def test_rate_is_not_rounded(self):
        register = make([("Ana", "present"), ("Ana", "absent"), ("Ana", "present")])
        expected = pd.DataFrame({"player": ["Ana"], "sessions": [3], "rate": [2 / 3]})
        pdt.assert_frame_equal(attendance(register), expected)

    def test_missing_status_is_left_out(self):
        register = make([("Ana", "present"), ("Ana", None), ("Ana", "absent"), ("Ben", None), ("Ben", "present")])
        expected = pd.DataFrame({"player": ["Ana", "Ben"], "sessions": [2, 1], "rate": [0.5, 1.0]})
        pdt.assert_frame_equal(attendance(register), expected)

    def test_sorted_by_player(self):
        register = make([("Zoe", "absent"), ("Max", "present"), ("Ana", "present"), ("Zoe", "present")])
        expected = pd.DataFrame({"player": ["Ana", "Max", "Zoe"], "sessions": [1, 1, 2], "rate": [1.0, 1.0, 0.5]})
        pdt.assert_frame_equal(attendance(register), expected)

    def test_player_with_nothing_recorded(self):
        register = make([("Ana", "present"), ("Dee", None), ("Dee", None)])
        expected = pd.DataFrame({"player": ["Ana"], "sessions": [1], "rate": [1.0]})
        pdt.assert_frame_equal(attendance(register), expected)

    def test_one_row(self):
        expected = pd.DataFrame({"player": ["Eli"], "sessions": [1], "rate": [0.0]})
        pdt.assert_frame_equal(attendance(make([("Eli", "absent")])), expected)

    def test_empty_register(self):
        result = attendance(make([]))
        self.assertEqual(list(result.columns), ["player", "sessions", "rate"])
        self.assertEqual(len(result), 0)


class SprintScoresTest(unittest.TestCase):
    def test_fastest_scores_one(self):
        np.testing.assert_allclose(sprint_scores(np.array([7.5, 6.0])), [0.8, 1.0])

    def test_scores_are_not_rounded(self):
        np.testing.assert_allclose(sprint_scores(np.array([6.0, 7.0])), [1.0, 6 / 7])

    def test_missing_time(self):
        np.testing.assert_allclose(sprint_scores(np.array([np.nan, 6.0, 7.5])), [np.nan, 1.0, 0.8])

    def test_every_time_missing(self):
        np.testing.assert_allclose(sprint_scores(np.array([np.nan, np.nan])), [np.nan, np.nan])

    def test_input_unchanged(self):
        times = np.array([6.4, np.nan, 7.2])
        before = times.copy()
        sprint_scores(times)
        np.testing.assert_array_equal(times, before)


if __name__ == "__main__":
    unittest.main(verbosity=2)
