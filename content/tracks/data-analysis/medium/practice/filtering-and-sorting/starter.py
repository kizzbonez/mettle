"""Shelter Board: filter and sort the animal shelter's list.

Every `raise NotImplementedError` marks code you still have to write.
Keep the function names and parameters: the tests call them.
"""

import pandas as pd


def available(animals, species, min_age, max_age):
    """Animals of the given species, vaccinated, not reserved, aged min_age to max_age inclusive."""
    # One mask per condition, combined with & and ~.
    raise NotImplementedError


def by_weight(animals):
    """Lightest first, not yet weighed at the top, ties in table order."""
    raise NotImplementedError


def longest_waiting(animals, n):
    """The n animals with the most days here, most first, earlier rows winning ties."""
    raise NotImplementedError


def adoption_board(animals):
    """name, species and days_here by species A to Z, then most days first, numbered from 0."""
    raise NotImplementedError
