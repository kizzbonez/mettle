import numpy as np
import pandas as pd

harvests = pd.read_csv("data/harvests.csv")

expected_summary = pd.DataFrame(
    {
        "total_kg": [4.6, 10.5, 1.4, 5.0],
        "heaviest_kg": [2.6, 4.5, 1.4, 5.0],
        "pickings": [4, 3, 3, 1],
        "weighed": [3, 3, 1, 1],
    },
    index=pd.Index(["A3", "B1", "C2", "D4"], name="plot"),
)
check_frame(plot_summary(harvests), expected_summary, "plot_summary of the example harvest log")

expected_columns = harvests.assign(
    kg_filled=[1.2, 4.5, 2.6, 1.4, 3.9, 4.6 / 3, 5.0, 1.4, 2.1, 0.8, 1.4],
    share=[0.196, 0.429, 0.424, 0.333, 0.371, 0.25, 1.0, 0.333, 0.2, 0.13, 0.333],
    pick_no=[1, 1, 2, 1, 2, 3, 1, 2, 3, 4, 3],
)
check_frame(add_plot_columns(harvests), expected_columns, "add_plot_columns of the example harvest log")

check_frame(
    regular_plots(harvests, 3),
    harvests.drop(index=6),
    "regular_plots(harvests, 3) of the example harvest log",
)
