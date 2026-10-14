import random


def fair_draw(tickets, prizes, seed):
    random.seed(seed)
    return list(zip(prizes, random.sample(tickets, min(len(prizes), len(tickets)))))


tickets = [7, 14, 21, 28, 35, 42, 49, 56]
prizes = ["bike", "tent", "book", "mug"]
tickets_before, prizes_before = list(tickets), list(prizes)

for seed in [0, 1, 11, 2026, 123456]:
    assert draw(tickets, prizes, seed) == fair_draw(tickets, prizes, seed), (
        "draw calls random.seed(seed), then random.sample once, and pairs prizes and tickets in order"
    )
assert draw(tickets, prizes, 5) == draw(tickets, prizes, 5), "the same seed gives the same winners"
assert tickets == tickets_before and prizes == prizes_before, "draw does not change the lists it is given"

result = draw(tickets, prizes, 3)
assert isinstance(result, list) and all(isinstance(pair, tuple) for pair in result), "draw returns a list of tuples"
assert len({ticket for _, ticket in result}) == len(prizes), "no ticket wins twice"

few = draw([3, 9], ["cake", "kite", "mug"], 1)
assert few == fair_draw([3, 9], ["cake", "kite", "mug"], 1), "with fewer tickets than prizes, every ticket wins one prize, first prizes first"
assert len(draw([4], ["cake", "kite"], 8)) == 1, "a single ticket wins only the first prize"
assert draw([], ["cake", "kite"], 1) == [], "with no tickets sold, nobody wins"
assert draw([1, 2, 3], [], 1) == [], "with no prizes, nobody wins"
