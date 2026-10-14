# limit: counts calls, refuses extra calls without running the function, checks its argument.
ran = []


@limit(3)
def boost_heating(room, degrees=1, *, minutes=30):
    ran.append(room)
    return (room, degrees, minutes)


assert boost_heating.remaining == 3, "remaining starts at the number given to limit"
assert boost_heating("hall") == ("hall", 1, 30), "defaults of the original function still apply"
assert boost_heating("lounge", 2, minutes=45) == ("lounge", 2, 45), "positional and keyword arguments are passed on"
assert boost_heating.remaining == 1, "remaining goes down by one per call"
assert boost_heating("attic", degrees=3) == ("attic", 3, 30), "the last allowed call still runs"
assert boost_heating.remaining == 0, "remaining reaches 0 after the last allowed call"

for attempt in range(2):
    try:
        boost_heating("cellar")
    except RuntimeError:
        pass
    else:
        raise AssertionError("a call after the limit is used up should raise RuntimeError")
assert ran == ["hall", "lounge", "attic"], "a refused call must not run the original function"
assert boost_heating.remaining == 0, "a refused call does not change remaining"


@limit(1)
def ring_bell():
    return "ding"


assert ring_bell() == "ding", "limit(1) allows exactly one call"
try:
    ring_bell()
except RuntimeError:
    pass
else:
    raise AssertionError("limit(1) should refuse the second call")


@limit(2)
def jammed():
    raise OSError("motor stuck")


try:
    jammed()
except OSError:
    pass
else:
    raise AssertionError("an error raised by the original function should reach the caller")
assert jammed.remaining == 1, "a call that was let through counts even when the function raised"

for bad in (0, -1, -20):
    try:
        limit(bad)
    except ValueError:
        pass
    else:
        raise AssertionError("limit should raise ValueError for a number of calls below 1")
