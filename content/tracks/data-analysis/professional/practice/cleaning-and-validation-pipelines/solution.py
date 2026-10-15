"""Pet Weigh-ins: check the front desk's weigh-in export before the nurses use it."""

import numpy as np
import pandas as pd

# Read the export with pd.read_csv("data/visits.csv", dtype=TEXT): the tests do the same.
TEXT = {"visit_id": "str", "pet": "str", "species": "str", "date": "str", "weight_kg": "float64"}
SPECIES = ["cat", "dog", "rabbit"]
DATE_FORMAT = "%Y-%m-%d"


def find_reasons(visits):
    """The first rule each row breaks, or "" for a good row, as a Series named reason."""
    pet = visits["pet"].str.strip()
    species = visits["species"].str.strip().str.lower()
    dates = pd.to_datetime(visits["date"], format=DATE_FORMAT, errors="coerce")
    rules = {
        "missing pet": pet.isna() | (pet == ""),
        "unknown species": ~species.isin(SPECIES),
        "bad date": dates.isna(),
        "bad weight": ~visits["weight_kg"].between(0.1, 90),
        "replaced": visits.duplicated(subset="visit_id", keep="last"),
    }
    reason = np.select(list(rules.values()), list(rules), default="")
    return pd.Series(reason, index=visits.index, name="reason")


def split_visits(visits):
    """(clean, quarantine): the good rows cleaned, and the bad rows as given with their reason."""
    reason = find_reasons(visits)
    good = reason == ""
    cleaned = pd.DataFrame({
        "visit_id": visits["visit_id"],
        "pet": visits["pet"].str.strip(),
        "species": visits["species"].str.strip().str.lower(),
        "date": pd.to_datetime(visits["date"], format=DATE_FORMAT, errors="coerce"),
        "weight_kg": visits["weight_kg"],
    })
    clean = cleaned[good].reset_index(drop=True)
    quarantine = visits[~good].assign(reason=reason[~good]).reset_index(drop=True)
    return clean, quarantine


def reason_counts(quarantine):
    """How many quarantined rows fell to each reason, reasons in alphabetical order."""
    return quarantine["reason"].value_counts().sort_index()
