"""Seed Library: tidy the hand-written details of donated seed packets.

Every `raise NotImplementedError` marks code you still have to write. Use the .str
accessor (strip, lower, upper, replace, extract, contains) and map: no loops over rows.
"""

import pandas as pd


def split_labels(labels):
    """crop, year and number from labels like TOM-2025-014; missing where a label does not fit."""
    # Named groups (?P<name>...) name the columns of str.extract.
    raise NotImplementedError


def seed_kind(answers):
    """Each free-text answer as one of heirloom, open-pollinated or hybrid, or missing."""
    raise NotImplementedError


def mentions(notes, phrase):
    """True where a note contains phrase, ignoring case and taking phrase literally."""
    raise NotImplementedError
