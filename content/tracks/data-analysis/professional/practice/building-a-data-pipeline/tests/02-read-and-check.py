import logging
from pathlib import Path

import pandas as pd

records = []


class Collect(logging.Handler):
    def emit(self, record):
        records.append(record)


root = logging.getLogger()
root.addHandler(Collect())
root.setLevel(logging.INFO)

Path("tickets-extra.csv").write_text(
    "vehicle,weight_kg,ticket,material,notes\n"
    "van,012.50,007,Metal,\n"
    "car,40,010,glass,wet\n",
    encoding="utf-8",
)
tickets = read_tickets("tickets-extra.csv")
check_frame(
    tickets,
    pd.DataFrame({
        "vehicle": ["van", "car"],
        "weight_kg": ["012.50", "40"],
        "ticket": ["007", "010"],
        "material": ["Metal", "glass"],
        "notes": [None, "wet"],
    }, dtype="str"),
    "read_tickets keeps every column, in file order, with every value read as text",
)
assert any(record.levelno == logging.INFO for record in records), "read_tickets logs at INFO what it read"

Path("tickets-no-weight.csv").write_text("ticket,material,kg\nT1,metal,4\n", encoding="utf-8")
try:
    read_tickets("tickets-no-weight.csv")
except ValueError as error:
    message = str(error)
else:
    raise AssertionError("read_tickets raises ValueError when a required column is missing")
assert "tickets-no-weight.csv" in message and "weight_kg" in message, (
    "the ValueError names the file and the missing column"
)

try:
    read_tickets("data/old-format.csv")
except ValueError as error:
    message = str(error)
else:
    raise AssertionError("read_tickets raises ValueError for the old export")
assert all(name in message for name in ["data/old-format.csv", "material", "weight_kg"]), (
    "the ValueError names the file and every missing column"
)

try:
    read_tickets("no-such-file.csv")
except OSError:
    pass
else:
    raise AssertionError("read_tickets lets the OSError of a missing file through to main")
