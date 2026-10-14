"""Garden Bird Count: merge the volunteers' tally sheets into one count."""

from pathlib import Path


class SurveyError(Exception):
    """Base class for every error this module raises."""


class SheetLineError(SurveyError):
    """A line of a tally sheet that cannot be read."""

    def __init__(self, line_number, text, reason):
        super().__init__(f"line {line_number}: {reason}")
        self.line_number = line_number
        self.text = text
        self.reason = reason


class MissingSheetError(SurveyError):
    """A tally sheet file that does not exist."""

    def __init__(self, path):
        super().__init__(f"no such sheet: {path}")
        self.path = path


class Sighting:
    """Some birds of one species, noted at one time."""

    def __init__(self, time, species, count):
        self.time = time
        self.species = species
        self.count = count

    def __repr__(self):
        return f"Sighting({self.time!r}, {self.species!r}, {self.count!r})"


def is_valid_time(text):
    hours, colon, minutes = text.partition(":")
    if colon != ":" or len(hours) != 2 or len(minutes) != 2:
        return False
    if not (hours.isdecimal() and minutes.isdecimal()):
        return False
    return int(hours) <= 23 and int(minutes) <= 59


def parse_line(text, line_number):
    match text.split():
        case [time, *words, count] if words:
            pass
        case _:
            raise SheetLineError(line_number, text, "too few fields")
    if not is_valid_time(time):
        raise SheetLineError(line_number, text, "bad time")
    if not count.isdecimal() or int(count) < 1:
        raise SheetLineError(line_number, text, "bad count")
    return Sighting(time, " ".join(words).lower(), int(count))


def sheet_lines(path):
    with open(path, encoding="utf-8") as sheet:
        for number, line in enumerate(sheet, start=1):
            text = line.strip()
            if text and not text.startswith("#"):
                yield number, text


class BirdCount:
    """Every sighting from the sheets added so far, and the lines that could not be read."""

    def __init__(self):
        self.sightings = []
        self.problems = []

    def add_sheet(self, path):
        path = Path(path)
        added = []
        problems = []
        try:
            for number, text in sheet_lines(path):
                try:
                    added.append(parse_line(text, number))
                except SheetLineError as error:
                    problems.append(f"{path.name} line {error.line_number}: {error.reason}")
        except FileNotFoundError as error:
            raise MissingSheetError(str(path)) from error
        self.sightings.extend(added)
        self.problems.extend(problems)
        return len(added)

    @property
    def total_birds(self):
        return sum(sighting.count for sighting in self.sightings)

    def totals(self):
        names = sorted({sighting.species for sighting in self.sightings})
        return {
            name: sum(sighting.count for sighting in self.sightings if sighting.species == name)
            for name in names
        }

    def top(self, n=3):
        ranked = sorted(self.totals().items(), key=lambda pair: (-pair[1], pair[0]))
        return ranked[:n]

    def seen_between(self, start, end):
        return sorted({sighting.species for sighting in self.sightings if start <= sighting.time <= end})
