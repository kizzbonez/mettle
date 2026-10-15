"""Cinema Weekend: sum up the screenings per film, per screen and day, and per day.

Every `raise NotImplementedError` marks code you still have to write.
Use groupby and value_counts: no loop over the films.
"""

import pandas as pd


def takings_by_film(screenings):
    """Total takings per film, highest first, ties A to Z."""
    raise NotImplementedError


def film_report(screenings):
    """One row per film: screenings, tickets, avg_rating and rated."""
    raise NotImplementedError


def per_screen_day(screenings):
    """Mean tickets per screen and day, rounded to 1 decimal."""
    raise NotImplementedError


def screenings_per_day(screenings):
    """The number of screenings per day, most first."""
    raise NotImplementedError
