"""Quiz League: season totals, the league table and each week's median score."""

import numpy as np


def team_totals(scores):
    """Each team's total over the weeks it played; 0.0 for a team that never played."""
    return np.nansum(scores, axis=1)


def league_table(names, scores):
    """The names by season total, highest first; ties keep the order of names."""
    order = np.argsort(-team_totals(scores), kind="stable")
    return names[order]


def week_medians(scores):
    """The median score of each week over the teams that played."""
    return np.nanmedian(scores, axis=0)
