"""Veg Box Files: save, reload and export the vegetable box deliveries."""

import pandas as pd

SIZE = pd.CategoricalDtype(["small", "medium", "large"], ordered=True)


def save(deliveries, path):
    """A plain CSV with box_id as its first column."""
    deliveries.to_csv(path)


def load(path):
    """Read a file written by save back to an equal frame."""
    return pd.read_csv(
        path,
        index_col="box_id",
        parse_dates=["delivered"],
        dtype={"size": SIZE, "bags_returned": "Int64"},
    )


def write_spreadsheet(deliveries, path):
    """';' fields, decimal comma, two-decimal weights, DD/MM/YYYY dates, UTF-8 with a BOM."""
    deliveries.to_csv(
        path,
        sep=";",
        decimal=",",
        float_format="%.2f",
        date_format="%d/%m/%Y",
        encoding="utf-8-sig",
    )


def write_feed(deliveries, path):
    """JSON Lines, one record per box with its box_id, ISO dates."""
    deliveries.reset_index().to_json(path, orient="records", lines=True, date_format="iso")
