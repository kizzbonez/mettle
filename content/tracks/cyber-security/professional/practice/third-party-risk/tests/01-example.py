# The example from the instructions.
pct = availability("data/outages-2026-10.csv", 31)
assert pct == 99.711, f"availability for October (31 days) should be 99.711, not {pct!r}"
assert service_credit(99.711) == 10, f"service_credit(99.711) should be 10, not {service_credit(99.711)!r}"

got = rank_bids("data/rfp-scores.csv", "data/conflicts.csv", {"security": 0.5, "functionality": 0.3, "price": 0.2})
expected = [("Kestrel Ticketing", 3.97), ("Turnstile Cloud", 3.57), ("Gatehouse Systems", 3.55)]
assert got == expected, f"rank_bids for the example should be {expected!r}, not {got!r}"
