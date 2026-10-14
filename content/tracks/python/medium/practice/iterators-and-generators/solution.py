"""Chore Rota: hand out the house chores in turn, one at a time."""

from itertools import islice


class Rota:
    """An iterator that gives out turns names, cycling through names."""

    def __init__(self, names, turns):
        self.names = list(names)
        self.left = turns if self.names else 0
        self.position = 0

    def __iter__(self):
        return self

    def __next__(self):
        if self.left <= 0:
            raise StopIteration
        name = self.names[self.position % len(self.names)]
        self.position += 1
        self.left -= 1
        return name


def rota(names):
    """Yield the names in order, for ever; nothing at all when names is empty."""
    if not names:
        return
    while True:
        yield from names


def first_turns(names, n):
    """The first n names of rota(names), as a list."""
    return list(islice(rota(names), n))


def schedule(chores, names):
    """Yield 'CHORE: NAME' for each chore, lazily, with the next name on the rota."""
    for chore, name in zip(chores, rota(names)):
        yield f"{chore}: {name}"
