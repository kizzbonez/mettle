# + builds a new basket, leaves both operands alone, and refuses other types.
bread = Basket(["rye", "sourdough", "rye"])
more = Basket(["rye", "bagel"])
total = bread + more

assert isinstance(total, Basket), "adding two baskets gives a Basket"
assert total is not bread and total is not more, "adding gives a new basket"
assert (total["rye"], total["sourdough"], total["bagel"]) == (3, 1, 1), "adding sums the counts of each item"
assert len(total) == 5, "the length of a sum is the sum of the lengths"
assert list(total) == ["bagel", "rye", "sourdough"], "the new basket loops over the items of both"
assert (bread["rye"], len(bread), "bagel" in bread) == (2, 3, False), "the left operand is unchanged"
assert (more["rye"], len(more), "sourdough" in more) == (1, 2, False), "the right operand is unchanged"

assert Basket() + bread == bread and bread + Basket() == bread, "adding an empty basket changes no counts"
assert (Basket() + Basket()) == Basket(), "two empty baskets add up to an empty basket"
assert sum([bread, more, Basket(["bagel"])], Basket())["bagel"] == 2, "sum works when it starts from an empty basket"

assert bread.__add__(5) is NotImplemented, "__add__ returns NotImplemented for a number"
assert bread.__add__(["rye"]) is NotImplemented, "__add__ returns NotImplemented for a list"
for other in (5, ["rye"], "rye"):
    for attempt in ("basket first", "basket second"):
        try:
            bread + other if attempt == "basket first" else other + bread
        except TypeError:
            pass
        else:
            raise AssertionError(f"adding a basket and a {type(other).__name__} should raise TypeError ({attempt})")
assert len(bread) == 3, "a refused addition leaves the basket unchanged"
