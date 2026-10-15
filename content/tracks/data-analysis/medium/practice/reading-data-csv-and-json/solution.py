"""Club Rides: read the cycling club's three files with the right options."""

import pandas as pd


def read_rides(path):
    """The rides export: ';' fields, decimal commas, dotted thousands, DD.MM.YYYY dates, '-' missing."""
    return pd.read_csv(
        path,
        sep=";",
        skiprows=2,
        usecols=["rider", "ride_date", "distance_km", "climb_m", "avg_speed_kmh"],
        dtype={"rider": "str"},
        decimal=",",
        thousands=".",
        na_values=["-"],
        parse_dates=["ride_date"],
        date_format="%d.%m.%Y",
    )


def read_members(path):
    """The member list without a header, indexed by member number as text."""
    return pd.read_csv(path, names=["member", "name", "group"], index_col="member", dtype={"member": "str"})


def read_checks(path):
    """The workshop's bike checks, one JSON object per line."""
    return pd.read_json(path, lines=True, dtype={"bike_id": "str", "member": "str"})
