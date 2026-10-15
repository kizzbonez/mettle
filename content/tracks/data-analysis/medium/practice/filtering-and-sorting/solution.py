"""Shelter Board: filter and sort the animal shelter's list."""

import pandas as pd


def available(animals, species, min_age, max_age):
    """Animals of the given species, vaccinated, not reserved, aged min_age to max_age inclusive."""
    keep = (
        animals["species"].isin(species)
        & animals["vaccinated"]
        & ~animals["reserved"]
        & animals["age_years"].between(min_age, max_age)
    )
    return animals[keep]


def by_weight(animals):
    """Lightest first, not yet weighed at the top, ties in table order."""
    return animals.sort_values("weight_kg", na_position="first", kind="stable")


def longest_waiting(animals, n):
    """The n animals with the most days here, most first, earlier rows winning ties."""
    return animals.nlargest(n, "days_here")


def adoption_board(animals):
    """name, species and days_here by species A to Z, then most days first, numbered from 0."""
    board = animals.sort_values(["species", "days_here"], ascending=[True, False])
    return board[["name", "species", "days_here"]].reset_index(drop=True)
