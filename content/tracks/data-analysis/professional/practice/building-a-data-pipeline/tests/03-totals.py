import logging

import pandas as pd

records = []


class Collect(logging.Handler):
    def emit(self, record):
        records.append(record)


root = logging.getLogger()
root.addHandler(Collect())
root.setLevel(logging.INFO)

tickets = pd.DataFrame(
    {
        "ticket": ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9"],
        "material": [" METAL", "metal ", "Glass", "glass", "Paper", "paper", "Paper", "Textiles", "wood"],
        "weight_kg": ["5", "4.99", "12kg", "", "0.12", "0.1", "abc", "7.26", "100"],
    },
    index=[90, 80, 70, 60, 50, 40, 30, 20, 10],
    dtype="str",
)
before = tickets.copy()

check_frame(
    totals(tickets, 0.1),
    pd.DataFrame({
        "material": ["metal", "paper", "textiles", "wood"],
        "tickets": [2, 2, 1, 1],
        "total_kg": [10.0, 0.2, 7.3, 100.0],
    }),
    "totals cleans the materials, skips weights that are not numbers, counts a weight equal to min_kg, "
    "rounds to 1 decimal and sorts by material with the index 0 to n-1",
)
assert any(record.levelno == logging.INFO for record in records), "totals logs at INFO how many tickets it kept"
check_frame(
    totals(tickets, 5.0),
    pd.DataFrame({"material": ["metal", "textiles", "wood"], "tickets": [1, 1, 1], "total_kg": [5.0, 7.3, 100.0]}),
    "totals uses the min_kg it is given",
)
check_frame(tickets, before, "totals does not change the tickets")

none = totals(tickets, 1_000.0)
assert isinstance(none, pd.DataFrame) and len(none) == 0, "when no ticket counts, totals returns a frame without rows"
assert list(none.columns) == ["material", "tickets", "total_kg"], "an empty summary still has the three columns"
