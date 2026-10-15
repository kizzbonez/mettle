"""Food Bank Donations: one readable chain from the volunteers' file to the weekly table."""

import pandas as pd


def tidy_name(name):
    """' Weight (g) ' becomes 'weight_g'."""
    return name.strip().lower().replace("(", "").replace(")", "").replace(" ", "_")


def tidy_names(df):
    """The same frame with every column name tidied."""
    return df.rename(columns=tidy_name)


def drop_small(df, min_kg):
    """The rows whose kg is at least min_kg."""
    return df.loc[pd.col("kg") >= min_kg]


def report(path, min_kg):
    """Donations and total kg per item type, heaviest first."""
    return (
        pd.read_csv(path)
        .pipe(tidy_names)
        .dropna(subset=["weight_g"])
        .assign(kg=pd.col("weight_g") / 1000)
        .pipe(drop_small, min_kg)
        .groupby("item_type")
        .agg(donations=("kg", "size"), total_kg=("kg", "sum"))
        .assign(total_kg=pd.col("total_kg").round(2))
        .sort_values("total_kg", ascending=False, kind="stable")
    )
