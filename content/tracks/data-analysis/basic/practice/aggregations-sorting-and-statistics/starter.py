"""Quiz League: season totals, the league table and each week's median score.

Every `raise NotImplementedError` marks code you still have to write. Keep the
names and parameters. scores has one row per team and one column per week,
with NaN for a week a team missed.
"""

import numpy as np


def team_totals(scores):
    """Each team's total over the weeks it played; 0.0 for a team that never played."""
    # TODO: a NaN-aware sum along the right axis.
    raise NotImplementedError


def league_table(names, scores):
    """The names by season total, highest first; ties keep the order of names."""
    # TODO: a stable argsort of the negated totals, used to index names.
    raise NotImplementedError


def week_medians(scores):
    """The median score of each week over the teams that played."""
    raise NotImplementedError
