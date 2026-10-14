# check_beds: levels, messages, order, lazy arguments, the boundary, no readings, and no configuration.
import logging

valves = logging.getLogger("greenhouse.valves")
assert valves.level == logging.NOTSET, "the library should not set a level on its logger; the application decides"
assert all(isinstance(h, logging.NullHandler) for h in valves.handlers), (
    "the library's logger should have no handlers, apart from a NullHandler"
)
root = logging.getLogger()
assert root.handlers == [], "importing the library should not add any handler to the root logger"


class Collect(logging.Handler):
    def __init__(self):
        super().__init__(logging.DEBUG)
        self.records = []

    def emit(self, record):
        self.records.append(record)


collector = Collect()
root.addHandler(collector)
valves.setLevel(logging.DEBUG)


def logged():
    rows = [(r.name, r.levelname, r.getMessage()) for r in collector.records]
    collector.records.clear()
    return rows


assert check_beds({}, 30) == [], "check_beds with no readings should return []"
assert logged() == [("greenhouse.valves", "ERROR", "no readings")], "no readings should log exactly one ERROR, 'no readings'"

assert check_beds({"herbs": 30}, 30) == [], "a bed reading exactly dry_below is not dry"
assert logged() == [("greenhouse.valves", "DEBUG", "bed herbs reads 30")], "one bed at the boundary should log one DEBUG record"

readings = {"zucchini": 3, "épinards": 12, "aubergine": 0}
assert check_beds(readings, 15) == ["zucchini", "épinards", "aubergine"], (
    "every dry bed should be returned in the order of readings, not sorted"
)
records = list(collector.records)
expected = [
    ("greenhouse.valves", "DEBUG", "bed zucchini reads 3"),
    ("greenhouse.valves", "WARNING", "bed zucchini is dry: 3 < 15"),
    ("greenhouse.valves", "DEBUG", "bed épinards reads 12"),
    ("greenhouse.valves", "WARNING", "bed épinards is dry: 12 < 15"),
    ("greenhouse.valves", "DEBUG", "bed aubergine reads 0"),
    ("greenhouse.valves", "WARNING", "bed aubergine is dry: 0 < 15"),
]
got = logged()
assert got == expected, f"each bed's DEBUG record should come before its WARNING; got {got}"
for record in records:
    assert record.args, f"the record {record.getMessage()!r} should keep its values in args (no f-strings)"
    assert "%" in record.msg, f"the message of {record.getMessage()!r} should be a template with placeholders"

assert root.handlers == [collector], "check_beds should not configure logging (no basicConfig, no handlers)"
