import numpy as np
import pandas as pd

stays = pd.read_csv("data/stays.csv")

check_frame(
    charges(stays),
    pd.Series([0.0, 3.0, 3.5, 2.25, 6.75, 0.0, np.nan, 10.0, 1.75], name="charge"),
    "charges of the example stays",
)
check_frame(
    stay_band(stays),
    pd.Series(
        ["quick", "short", "half day", "long", "long", "long", "short", "long", "half day"],
        name="band",
    ),
    "stay_band of the example stays",
)
