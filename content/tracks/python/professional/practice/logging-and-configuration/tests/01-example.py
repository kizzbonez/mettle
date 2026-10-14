# The example from the instructions: the greenhouse settings and one round of readings.
import logging

root = logging.getLogger()
assert root.handlers == [], "importing the library should not add any handler to the root logger"

settings = load_settings("data/greenhouse.toml", {"GREENHOUSE_LEVEL": "info", "HOME": "/home/ines"})
expected = {
    "level": "INFO",
    "dry_below": 35,
    "beds": ["tomatoes", "herbs", "chillies"],
    "pump": {"litres_per_minute": 12},
}
assert settings == expected, f"load_settings for the example should return {expected}, not {settings}"


class Collect(logging.Handler):
    def __init__(self):
        super().__init__(logging.DEBUG)
        self.records = []

    def emit(self, record):
        self.records.append(record)


collector = Collect()
root.addHandler(collector)
logging.getLogger("greenhouse.valves").setLevel(logging.DEBUG)

dry = check_beds({"tomatoes": 41, "herbs": 22, "chillies": 35}, 35)
assert dry == ["herbs"], f"check_beds for the example should return ['herbs'], not {dry}"

expected_records = [
    ("greenhouse.valves", "DEBUG", "bed tomatoes reads 41"),
    ("greenhouse.valves", "DEBUG", "bed herbs reads 22"),
    ("greenhouse.valves", "WARNING", "bed herbs is dry: 22 < 35"),
    ("greenhouse.valves", "DEBUG", "bed chillies reads 35"),
]
got = [(record.name, record.levelname, record.getMessage()) for record in collector.records]
assert got == expected_records, (
    "check_beds should log these records (logger, level, message), in this order:\n"
    + "\n".join(map(str, expected_records)) + "\nIt logged:\n" + "\n".join(map(str, got))
)
for record in collector.records:
    assert record.args, (
        f"the record {record.getMessage()!r} has no args: pass the values as arguments, not in an f-string"
    )
assert root.handlers == [collector], "check_beds should not add handlers to the root logger (no basicConfig in a library)"
