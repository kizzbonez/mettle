import pandas as pd

plots = pd.DataFrame(
    {
        "plot": ["K1", "K2", "K3", "K4"],
        "holder": ["Ali", "Bo", "Cleo", "Dan"],
        "size_m2": [60, 125, 250, 125],
        "rent": [18.0, 33.33, 61.0, 0.0],
        "paid": [True, False, False, True],
    },
    index=["k1", "k2", "k3", "k4"],
)
register = plots
others = plots.drop(columns=["rent"])

assert raise_rent(plots, 10) is None, "raise_rent returns None"
assert plots is register, "raise_rent changes the frame it is given, not a new one"
check_frame(
    plots["rent"],
    pd.Series([19.8, 36.66, 67.1, 0.0], index=["k1", "k2", "k3", "k4"], name="rent"),
    "raise_rent multiplies every rent in plots and rounds to 2 decimals",
)
check_frame(plots.drop(columns=["rent"]), others, "raise_rent changes only rent")

raise_rent(plots, -10)
check_frame(
    plots["rent"],
    pd.Series([17.82, 32.99, 60.39, 0.0], index=["k1", "k2", "k3", "k4"], name="rent"),
    "a negative percent cuts the rents, rounded to 2 decimals",
)
raise_rent(plots, 0)
check_frame(
    plots["rent"],
    pd.Series([17.82, 32.99, 60.39, 0.0], index=["k1", "k2", "k3", "k4"], name="rent"),
    "a percent of 0 leaves the rents as they are",
)
assert str(plots["rent"].dtype) == "float64", "rent stays float64"
