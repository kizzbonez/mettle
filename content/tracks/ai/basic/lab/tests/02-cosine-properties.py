def close(actual, expected):
    return abs(actual - expected) < 1e-9


same = cosine_similarity([0.2, 0.5, 0.1], [0.2, 0.5, 0.1])
assert close(same, 1.0), "a vector compared with itself should score 1"

stretched = cosine_similarity([1.0, 2.0, 3.0], [10.0, 20.0, 30.0])
assert close(stretched, 1.0), "two vectors that point the same way should score 1 whatever their lengths"

opposite = cosine_similarity([1.0, 2.0, 3.0], [-2.0, -4.0, -6.0])
assert close(opposite, -1.0), "two vectors that point in opposite directions should score -1"

right_angle = cosine_similarity([1.0, 0.0, 0.0], [0.0, 5.0, 0.0])
assert close(right_angle, 0.0), "two vectors at right angles should score 0"

mixed = cosine_similarity((1.0, 2.0, 2.0), (2.0, 0.0, 1.0))
assert close(mixed, 4.0 / (3.0 * 5.0**0.5)), "the score for two ordinary 3-component vectors is wrong"

assert close(cosine_similarity([2, 0], [1, 1]), 0.5**0.5), "integer components should work like floats"

zero_first = cosine_similarity([0.0, 0.0, 0.0], [1.0, 2.0, 3.0])
assert zero_first == 0.0, "a zero-length first vector should give 0.0, without an error"

zero_second = cosine_similarity([1.0, 2.0, 3.0], [0.0, 0.0, 0.0])
assert zero_second == 0.0, "a zero-length second vector should give 0.0, without an error"

assert isinstance(same, float), "cosine_similarity should return a float"

try:
    cosine_similarity([1.0, 2.0, 3.0], [1.0, 2.0])
except ValueError:
    pass
else:
    raise AssertionError("vectors with different numbers of components should raise ValueError")
