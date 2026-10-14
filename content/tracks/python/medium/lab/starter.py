"""Garden Bird Count: merge the volunteers' tally sheets into one count.

Every `raise NotImplementedError` below marks code you still have to write.
Keep every class, method and function name and its parameters: the tests use them.
You may add helper functions and private attributes.
"""

from pathlib import Path


class SurveyError(Exception):
    """Base class for every error this module raises."""


class SheetLineError(SurveyError):
    """A line of a tally sheet that cannot be read."""

    def __init__(self, line_number, text, reason):
        # TODO 1: give the base class the message "line N: REASON",
        #         then store line_number, text and reason as attributes.
        raise NotImplementedError


class MissingSheetError(SurveyError):
    """A tally sheet file that does not exist."""

    def __init__(self, path):
        # TODO 2: the message is "no such sheet: PATH"; store path as an attribute.
        raise NotImplementedError


class Sighting:
    """Some birds of one species, noted at one time."""

    def __init__(self, time, species, count):
        # TODO 3: store time, species and count.
        raise NotImplementedError

    def __repr__(self):
        # For example: Sighting('07:05', 'blue tit', 4)
        raise NotImplementedError


def parse_line(text, line_number):
    """Return a Sighting for one line, or raise SheetLineError with the first problem."""
    # TODO 4: check the number of fields, then the time, then the count.
    raise NotImplementedError


def sheet_lines(path):
    """Yield (line_number, text) for every line that is not blank and not a comment."""
    # TODO 5: make this a generator function that reads the file as UTF-8.
    raise NotImplementedError


class BirdCount:
    """Every sighting from the sheets added so far, and the lines that could not be read."""

    def __init__(self):
        self.sightings = []
        self.problems = []

    def add_sheet(self, path):
        """Read one sheet, keep its sightings and report its unreadable lines."""
        # TODO 6: use sheet_lines and parse_line; turn FileNotFoundError into MissingSheetError.
        raise NotImplementedError

    @property
    def total_birds(self):
        raise NotImplementedError

    def totals(self):
        raise NotImplementedError

    def top(self, n=3):
        raise NotImplementedError

    def seen_between(self, start, end):
        raise NotImplementedError
