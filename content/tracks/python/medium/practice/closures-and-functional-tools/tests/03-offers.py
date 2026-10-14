assert make_offers([]) == [], "no percentages give no offers"

offers = make_offers([10, 20, 30])
assert len(offers) == 3 and all(callable(offer) for offer in offers), "make_offers returns one function per percentage"
assert [offer(100) for offer in offers] == [90.0, 80.0, 70.0], "each offer uses its own percentage, in the order given"
assert offers[0](4.0) == 3.6, "the first offer still uses the first percentage after the others were made"

none, everything = make_offers([0, 100])
assert none(4.2) == 4.2, "an offer of 0 percent keeps the price"
assert everything(4.2) == 0.0, "an offer of 100 percent makes it free"
assert make_offers([25])[0](1.6) == 1.2, "an offer of 25 percent takes a quarter off"
assert make_offers([15])[0](3.3) == round(3.3 * 0.85, 2), "the result is rounded to two decimals"
twice = make_offers([50, 50])
assert twice[0](1.0) == twice[1](1.0) == 0.5, "the same percentage twice gives two equal offers"
