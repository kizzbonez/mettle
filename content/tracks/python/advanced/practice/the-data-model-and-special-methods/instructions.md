`Basket` counts how many of each item a shopper has picked. The starter's `__init__` already
counts the item names it is given into `self._counts`, a dict from item name to count, and
`__repr__` is done. Write the special methods marked `raise NotImplementedError`:

1. `__len__`: `len(basket)` is the number of items, repeats included. An empty basket is
   therefore false.
2. `__getitem__`: `basket[item]` is how many of `item` the basket holds, and `0` for an item that
   is not in it (never a `KeyError`).
3. `__contains__`: `item in basket` is `True` when the basket holds at least one.
4. `__iter__`: a loop over the basket gives each different item once, in sorted order (the order
   `sorted` gives). Every loop starts from the beginning.
5. `__eq__` and `__hash__`: two baskets are equal when they hold the same items in the same
   numbers, whatever order they were picked in. For anything that is not a `Basket`, `__eq__`
   returns `NotImplemented`. Equal baskets must have equal hashes, so baskets can be set members
   and dict keys.
6. `__add__`: `basket + other` is a **new** `Basket` holding the items of both; neither operand
   changes. For anything that is not a `Basket`, return `NotImplemented`, so that `basket + 3`
   raises `TypeError`.

Example:

```python
morning = Basket(["apple", "pear", "apple"])
later = Basket(["fig", "apple"])
len(morning), morning["apple"], morning["kiwi"]    # (3, 2, 0)
"pear" in morning, "kiwi" in morning               # (True, False)
list(morning + later)                              # ['apple', 'fig', 'pear']
(morning + later)["apple"], morning["apple"]       # (3, 2)
morning == Basket(["pear", "apple", "apple"])      # True
len({morning, Basket(["apple", "pear", "apple"])}) # 1
bool(Basket())                                     # False
morning + 3                                        # TypeError: unsupported operand type(s) for +
```

**Tip:** a `frozenset` of the dict's `(item, count)` pairs does not depend on order and is
hashable.
