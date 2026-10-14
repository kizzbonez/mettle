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
        # The number of items, repeats included.
        raise NotImplementedError("write __len__")

    def __getitem__(self, item):
        # How many of item; 0 when it is not in the basket.
        raise NotImplementedError("write __getitem__")

    def __contains__(self, item):
        # True when the basket holds at least one.
        raise NotImplementedError("write __contains__")

    def __iter__(self):
        # Each different item once, in sorted order.
        raise NotImplementedError("write __iter__")

    def __eq__(self, other):
        # Same items in the same numbers; NotImplemented for a non-Basket.
        raise NotImplementedError("write __eq__")

    def __hash__(self):
        # Equal baskets must hash equal.
        raise NotImplementedError("write __hash__")

    def __add__(self, other):
        # A new Basket with the items of both; NotImplemented for a non-Basket.
        raise NotImplementedError("write __add__")
