sell = make_stand(5)
assert (sell(2), sell(4), sell()) == (2, 3, 0), "sell(2), sell(4) and sell() on a stand of 5 slices, as in the example"

half, tenth = make_offers([50, 10])
assert (half(3.0), tenth(2.5)) == (1.5, 2.25), "the 50 and 10 percent offers from the example"

sales = [
    {"item": "brownie", "sold": 14},
    {"item": "flapjack", "sold": 9},
    {"item": "apple cake", "sold": 14},
]
assert best_sellers(sales, 2) == ["apple cake", "brownie"], "best_sellers(sales, 2) from the example"
