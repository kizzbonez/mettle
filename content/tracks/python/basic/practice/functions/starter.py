# Reading Time
#
# The tests call the four functions below directly, with their own arguments,
# so keep each name and parameter list exactly as it is. Replace each line
# `raise NotImplementedError` with the function's body. That line only stops
# the function with an error until you do; lesson 14 explains raise.

import math


def count_words(text):
    """Return the number of words in text, separated by any whitespace."""
    raise NotImplementedError


def reading_minutes(text, words_per_minute=200):
    """Return the whole minutes it takes to read text, rounded up."""
    raise NotImplementedError


def add_tag(tag, tags=None):
    """Add tag, cleaned up, to the list tags unless it is there already, and return the list."""
    raise NotImplementedError


def print_card(title, text, words_per_minute=200):
    """Print the title, then a line with the words and the minutes it takes to read text."""
    raise NotImplementedError
