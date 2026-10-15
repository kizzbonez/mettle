import pandas as pd

plots = pd.DataFrame(
    {
        "plot": ["P01", "P02", "P03", "P04", "P05"],
        "holder": ["Okafor", "Lund", "Okafor", "Patel", "Reyes"],
        "size_m2": [125, 250, 125, 60, 250],
        "rent": [32.5, 60.0, 32.5, 18.0, 60.0],
        "paid": [False, True, False, False, True],
    }
)
assert mark_paid(plots, "Okafor") is None, "mark_paid returns None"
assert plots["paid"].tolist() == [True, True, True, False, True], "mark_paid(plots, 'Okafor') changes plots, as in the example"
assert raise_rent(plots, 4) is None, "raise_rent returns None"
check_frame(
    plots["rent"],
    pd.Series([33.8, 62.4, 33.8, 18.72, 62.4], name="rent"),
    "raise_rent(plots, 4) changes the rents in plots, as in the example",
)
before = plots.copy()
check_frame(
    late_list(plots, 5.0),
    pd.DataFrame(
        {"plot": ["P04"], "holder": ["Patel"], "size_m2": [60], "rent": [23.72], "paid": [False]},
        index=[3],
    ),
    "late_list(plots, 5.0), as in the example",
)
check_frame(plots, before, "late_list leaves plots unchanged, as in the example")
rents = rent_array(plots)
rents[0] = 0.0
assert plots["rent"].iloc[0] == 33.8, "writing to the array from rent_array leaves plots unchanged, as in the example"
