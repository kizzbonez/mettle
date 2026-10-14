# A market basket that behaves like a built-in container.


class Basket:
    def __init__(self, items=()):
        # Count the item names: Basket(["apple", "apple"])._counts is {"apple": 2}.
        self._counts = {}
        for item in items:
            self._counts[item] = self._counts.get(item, 0) + 1

    def __repr__(self):
        return f"Basket({dict(sorted(self._counts.items()))!r})"

    def __len__(self):
        return sum(self._counts.values())

    def __getitem__(self, item):
        return self._counts.get(item, 0)

    def __contains__(self, item):
        return item in self._counts

    def __iter__(self):
        return iter(sorted(self._counts))

    def __eq__(self, other):
        if not isinstance(other, Basket):
            return NotImplemented
        return self._counts == other._counts

    def __hash__(self):
        return hash(frozenset(self._counts.items()))

    def __add__(self, other):
        if not isinstance(other, Basket):
            return NotImplemented
        combined = Basket()
        for basket in (self, other):
            for item, count in basket._counts.items():
                combined._counts[item] = combined._counts.get(item, 0) + count
        return combined
