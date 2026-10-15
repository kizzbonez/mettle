"""Cinema Weekend: sum up the screenings per film, per screen and day, and per day."""

import pandas as pd


def takings_by_film(screenings):
    """Total takings per film, highest first, ties A to Z."""
    totals = screenings.groupby("film")["takings"].sum()
    return totals.sort_values(ascending=False, kind="stable")


def film_report(screenings):
    """One row per film: screenings, tickets, avg_rating and rated."""
    report = screenings.groupby("film", as_index=False).agg(
        screenings=("film", "size"),
        tickets=("tickets", "sum"),
        avg_rating=("rating", "mean"),
        rated=("rating", "count"),
    )
    report["avg_rating"] = report["avg_rating"].round(2)
    report = report.sort_values(["tickets", "film"], ascending=[False, True])
    return report.reset_index(drop=True)


def per_screen_day(screenings):
    """Mean tickets per screen and day, rounded to 1 decimal."""
    means = screenings.groupby(["screen", "day"], as_index=False).agg(avg_tickets=("tickets", "mean"))
    means["avg_tickets"] = means["avg_tickets"].round(1)
    return means


def screenings_per_day(screenings):
    """The number of screenings per day, most first."""
    return screenings["day"].value_counts()
