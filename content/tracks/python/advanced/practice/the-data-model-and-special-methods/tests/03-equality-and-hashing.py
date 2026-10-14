# == compares contents, returns NotImplemented for other types, and agrees with the hash.
a = Basket(["plum", "plum", "egg"])
b = Basket(["egg", "plum", "plum"])
c = Basket(["plum", "egg"])

assert a == b, "the order the items were picked in does not matter"
assert not (a != b), "!= agrees with =="
assert a != c, "baskets with different counts are not equal"
assert Basket() == Basket(), "two empty baskets are equal"
assert Basket(["egg"]) != Basket(["Egg"]), "item names are compared exactly"

assert a.__eq__(["plum", "plum", "egg"]) is NotImplemented, "__eq__ returns NotImplemented for a list"
assert a.__eq__("plum") is NotImplemented, "__eq__ returns NotImplemented for a string"
assert a.__eq__({"plum": 2, "egg": 1}) is NotImplemented, "__eq__ returns NotImplemented for a dict"
assert (a == {"plum": 2, "egg": 1}) is False, "a basket is not equal to a dict with the same counts"

assert hash(a) == hash(b), "equal baskets have equal hashes"
assert hash(Basket()) == hash(Basket()), "empty baskets have equal hashes"
assert len({a, b, c, Basket(), Basket()}) == 3, "a set keeps one of each group of equal baskets"
prices = {a: 340}
assert prices[b] == 340, "an equal basket finds the same dict entry"
assert c not in prices, "a different basket is not found in the dict"
