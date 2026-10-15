# accept_request(): the window on both sides, replays, and failing closed on malformed requests.
NOW = 1792137600

seen = set()
assert accept_request({"nonce": "n1", "timestamp": NOW - 300}, seen, NOW) is True, "a request exactly 300 seconds old is inside the window"
assert accept_request({"nonce": "n2", "timestamp": NOW + 300}, seen, NOW) is True, "a request 300 seconds in the future (clock skew) is inside the window"
assert accept_request({"nonce": "n3", "timestamp": NOW - 301}, seen, NOW) is False, "a request 301 seconds old is outside the window"
assert accept_request({"nonce": "n4", "timestamp": NOW + 301}, seen, NOW) is False, "a request 301 seconds in the future is outside the window"
assert accept_request({"nonce": "n5", "timestamp": NOW - 50}, seen, NOW, window=30) is False, "the window argument should be used"
assert accept_request({"nonce": "n1", "timestamp": NOW}, seen, NOW) is False, "a nonce already accepted is a replay, even with a new timestamp"
assert seen == {"n1", "n2"}, "only accepted nonces should be added to seen"

malformed = [
    (None, "None instead of a dict"),
    (["n6", NOW], "a list instead of a dict"),
    ({}, "an empty dict"),
    ({"nonce": "n7"}, "a missing timestamp"),
    ({"timestamp": NOW}, "a missing nonce"),
    ({"nonce": "", "timestamp": NOW}, "an empty nonce"),
    ({"nonce": 8, "timestamp": NOW}, "a nonce that is not a str"),
    ({"nonce": "n9", "timestamp": str(NOW)}, "a timestamp given as a str"),
    ({"nonce": "n10", "timestamp": None}, "a timestamp of None"),
    ({"nonce": "n11", "timestamp": float(NOW)}, "a timestamp given as a float"),
]
for request, what in malformed:
    try:
        result = accept_request(request, seen, NOW)
    except Exception as error:
        raise AssertionError(f"accept_request should fail closed and return False for {what}, but raised {type(error).__name__}")
    assert result is False, f"accept_request should return False for {what}"
assert seen == {"n1", "n2"}, "rejected requests should not add anything to seen"
