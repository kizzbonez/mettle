# ways_to_score: counts sequences of wins and draws, and is cached with functools.cache.
assert callable(getattr(ways_to_score, "cache_info", None)), "ways_to_score should be decorated with functools.cache"

expected = [1]
for n in range(1, 301):
    expected.append(expected[n - 1] + (expected[n - 3] if n >= 3 else 0))

assert ways_to_score(0) == 1, "there is exactly one way to score 0 points"
assert ways_to_score(-1) == 0 and ways_to_score(-3) == 0, "there is no way to score a negative number"
for points in range(1, 13):
    assert ways_to_score(points) == expected[points], f"counting the ways to score {points} points"
assert ways_to_score(300) == expected[300], "counting the ways to score 300 points"
assert ways_to_score.cache_info().currsize > 0, "the cache holds results after the calls"
