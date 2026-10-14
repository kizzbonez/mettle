"""The parcel depot's three hot spots, rewritten with the right data structures."""
import functools
from itertools import pairwise


def first_repeat(scans):
    """Return the first code in SCANS that is scanned a second time, or None."""
    seen = set()
    for code in scans:
        if code in seen:
            return code
        seen.add(code)
    return None


def smallest_gap(times):
    """Return the smallest difference between two of TIMES, or None for fewer than two."""
    if len(times) < 2:
        return None
    return min(later - earlier for earlier, later in pairwise(sorted(times)))


def route_minutes(stops, lookup):
    """Return the total minutes of the legs between consecutive STOPS, asking LOOKUP once per leg."""
    leg = functools.cache(lookup)
    return sum(leg(origin, destination) for origin, destination in pairwise(stops))
