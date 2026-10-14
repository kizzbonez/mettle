"""The parcel depot's three hot spots, rewritten with the right data structures."""
import functools
from itertools import pairwise


def first_repeat(scans):
    """Return the first code in SCANS that is scanned a second time, or None."""
    # YOUR CODE: one pass, with the codes seen so far in a set.
    raise NotImplementedError


def smallest_gap(times):
    """Return the smallest difference between two of TIMES, or None for fewer than two."""
    # YOUR CODE: sort a copy once, then compare neighbours (pairwise helps).
    raise NotImplementedError


def route_minutes(stops, lookup):
    """Return the total minutes of the legs between consecutive STOPS, asking LOOKUP once per leg."""
    # YOUR CODE: a cached version of lookup, made inside this function, then add up the legs.
    raise NotImplementedError
