import math

import raffle_data

result = draw(list(range(101, 121)), ["hamper", "kite", "voucher"], 2026)
assert result == [("hamper", 104), ("kite", 111), ("voucher", 117)], (
    "draw pairs the prizes with the tickets sampled after random.seed(2026), as in the example"
)
assert len(draw([5, 9], ["hamper", "kite", "voucher"], 7)) == 2, "with two tickets and three prizes, draw returns two pairs"
assert public_names(raffle_data) == ["PRIZES", "SEED", "TICKETS"], "the public names of raffle_data, as in the example"
assert public_names(math)[:4] == ["acos", "acosh", "asin", "asinh"], "the first public names of math, as in the example"

ran = run_script()
assert ran.code == 0, f"python solution.py runs without an error; it said: {ran.err.strip()}"
assert ran.out == "hamper: ticket 104\nkite: ticket 111\nvoucher: ticket 117\n", (
    "the lines python solution.py prints for the organisers' raffle_data.py"
)
