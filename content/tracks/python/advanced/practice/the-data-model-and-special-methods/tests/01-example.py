# The market example from the instructions.
morning = Basket(["apple", "pear", "apple"])
later = Basket(["fig", "apple"])

assert len(morning) == 3, "len counts every item, repeats included"
assert morning["apple"] == 2, "basket[item] is how many of that item the basket holds"
assert morning["kiwi"] == 0, "basket[item] is 0 for an item that is not in the basket"
assert "pear" in morning and "kiwi" not in morning, "in tells whether the basket holds the item"
both = morning + later
assert list(both) == ["apple", "fig", "pear"], "a loop gives each different item once, in sorted order"
assert both["apple"] == 3 and morning["apple"] == 2, "+ adds the counts into a new basket and leaves the operands alone"
assert morning == Basket(["pear", "apple", "apple"]), "baskets with the same items in the same numbers are equal"
assert len({morning, Basket(["apple", "pear", "apple"])}) == 1, "equal baskets count once in a set"
assert not Basket(), "an empty basket is false"

try:
    morning + 3
except TypeError:
    pass
else:
    raise AssertionError("adding a number to a basket should raise TypeError")
