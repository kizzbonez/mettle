# Length, truth, indexing, membership and iteration, including empty and Unicode baskets.
empty = Basket()
assert len(empty) == 0, "an empty basket has length 0"
assert bool(empty) is False, "an empty basket is false"
assert list(empty) == [], "a loop over an empty basket gives nothing"
assert empty["apple"] == 0, "indexing an empty basket gives 0"
assert "apple" not in empty, "nothing is in an empty basket"

one = Basket(["leek"])
assert len(one) == 1 and bool(one) is True, "a basket with one item has length 1 and is true"
assert list(one) == ["leek"], "a loop over a one-item basket gives that item"

veg = Basket(["kale", "beet", "kale", "kale", "carrot", "beet"])
assert len(veg) == 6, "len counts repeats"
assert (veg["kale"], veg["beet"], veg["carrot"], veg["Kale"]) == (3, 2, 1, 0), "basket[item] gives each item's count"
assert list(veg) == ["beet", "carrot", "kale"], "a loop gives each different item once, sorted"
assert list(veg) == ["beet", "carrot", "kale"], "a second loop starts from the beginning again"
assert sorted(veg) == list(veg) and len(list(veg)) == 3, "iteration does not repeat items"
assert all(item in veg for item in ["kale", "beet", "carrot"]), "in finds every item in the basket"
assert "Kale" not in veg and "" not in veg, "in is False for items that are not in the basket"

spicy = Basket(["jalapeño", "crème fraîche", "jalapeño", "😀"])
assert len(spicy) == 4, "len works with Unicode item names"
assert spicy["jalapeño"] == 2 and spicy["😀"] == 1, "indexing works with Unicode item names"
assert list(spicy) == sorted(["jalapeño", "crème fraîche", "😀"]), "Unicode item names are looped over in sorted order"

picked = iter(veg)
assert next(picked) == "beet", "iter(basket) returns an iterator over the sorted items"
