"""Chore Rota: hand out the house chores in turn, one at a time.

Every `raise NotImplementedError` marks code you still have to write. Keep the
names and parameters: the tests use them.
"""

from itertools import islice


class Rota:
    """An iterator that gives out turns names, cycling through names."""

    def __init__(self, names, turns):
        # YOUR CODE: keep what __next__ needs, such as the names, a position
        # and how many turns are left.
        raise NotImplementedError

    def __iter__(self):
        raise NotImplementedError

    def __next__(self):
        # Raise StopIteration when no turns are left.
        raise NotImplementedError


def rota(names):
    """Yield the names in order, for ever; nothing at all when names is empty."""
    raise NotImplementedError


def first_turns(names, n):
    """The first n names of rota(names), as a list."""
    raise NotImplementedError


def schedule(chores, names):
    """Yield 'CHORE: NAME' for each chore, lazily, with the next name on the rota."""
    raise NotImplementedError
