# Quiz league numbers with itertools and functools.
from functools import cache
from itertools import accumulate, combinations, groupby, permutations

POINTS = {"W": 3, "D": 1, "L": 0}


def running_points(results):
    return list(accumulate(POINTS[letter] for letter in results))


def streaks(results):
    return [(letter, len(list(group))) for letter, group in groupby(results)]


def fixtures(teams, both_legs=False):
    if both_legs:
        return list(permutations(teams, 2))
    return list(combinations(teams, 2))


@cache
def ways_to_score(points):
    if points < 0:
        return 0
    if points == 0:
        return 1
    return ways_to_score(points - POINTS["W"]) + ways_to_score(points - POINTS["D"])
