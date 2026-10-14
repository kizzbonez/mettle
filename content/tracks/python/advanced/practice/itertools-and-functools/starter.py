# Quiz league numbers with itertools and functools.
from functools import cache
from itertools import accumulate, combinations, groupby, permutations

POINTS = {"W": 3, "D": 1, "L": 0}


def running_points(results):
    # The total after each match, with accumulate. "" gives [].
    raise NotImplementedError("write running_points")


def streaks(results):
    # A (letter, length) tuple for each run of equal results, with groupby.
    raise NotImplementedError("write streaks")


def fixtures(teams, both_legs=False):
    # Pairs from combinations, or from permutations when both_legs is True.
    raise NotImplementedError("write fixtures")


# Decorate with @cache.
def ways_to_score(points):
    # 1 way to score 0, none to score less; the last match was a W or a D.
    raise NotImplementedError("write ways_to_score")
