sales = [
    {"item": "scone", "sold": 6},
    {"item": "victoria sponge", "sold": 11},
    {"item": "lemon drizzle", "sold": 11},
    {"item": "carrot cake", "sold": 2},
    {"item": "banana bread", "sold": 6},
]
before = [dict(sale) for sale in sales]

assert best_sellers(sales, 1) == ["lemon drizzle"], "the item sold most comes first, ties in alphabetical order"
assert best_sellers(sales, 3) == ["lemon drizzle", "victoria sponge", "banana bread"], (
    "items are ordered by number sold, highest first, then alphabetically"
)
assert best_sellers(sales, 5) == ["lemon drizzle", "victoria sponge", "banana bread", "scone", "carrot cake"], (
    "every item appears once, in order"
)
assert best_sellers(sales, 50) == best_sellers(sales, 5), "asking for more items than there are returns them all"
assert best_sellers(sales, 0) == [], "asking for no items returns an empty list"
assert best_sellers([], 3) == [], "with no sales the list is empty"
assert sales == before, "best_sellers does not change the list it is given"
assert best_sellers([{"item": "tart", "sold": 0}], 1) == ["tart"], "an item that sold nothing is still listed"
