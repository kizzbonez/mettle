"""Seed Library: tidy the hand-written details of donated seed packets."""

import pandas as pd

LABEL = r"^(?P<crop>[A-Z]{3})-(?P<year>\d{4})-(?P<number>\d{3})$"
KINDS = {
    "heirloom": "heirloom",
    "op": "open-pollinated",
    "open pollinated": "open-pollinated",
    "open-pollinated": "open-pollinated",
    "f1": "hybrid",
    "f1 hybrid": "hybrid",
    "hybrid": "hybrid",
}


def split_labels(labels):
    """crop, year and number from labels like TOM-2025-014; missing where a label does not fit."""
    parts = labels.str.strip().str.upper().str.extract(LABEL)
    return parts.assign(year=parts["year"].astype(float))


def seed_kind(answers):
    """Each free-text answer as one of heirloom, open-pollinated or hybrid, or missing."""
    clean = answers.str.strip().str.lower()
    clean = clean.str.replace(r"\s*\(.*\)", "", regex=True).str.replace(r"\s+", " ", regex=True)
    kinds = pd.Categorical(clean.map(KINDS), categories=["heirloom", "open-pollinated", "hybrid"])
    return pd.Series(kinds, index=answers.index, name="kind")


def mentions(notes, phrase):
    """True where a note contains phrase, ignoring case and taking phrase literally."""
    return notes.str.contains(phrase, case=False, regex=False)
