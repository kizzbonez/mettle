import numpy as np
import pandas as pd

stays = pd.DataFrame(
    {
        "car_park": [
            "high street",
            "high street",
            "high street",
            "high street",
            "high street",
            "high street",
            "high street",
            "high street",
            "high street",
            "station",
            "leisure centre",
            "Station",
            "depot",
            "depot",
            "station",
        ],
        "minutes": [1, 30, 31, 120, 121, 240, 241, 600, 601, 659, 2000, 45, 45, 45, 840],
        "blue_badge": [False] * 13 + [True, True],
    },
    index=range(1000, 985, -1),
)
before = stays.copy()
result = charges(stays)
assert isinstance(result, pd.Series), "charges returns a Series"
expected = pd.Series(
    [0.0, 0.0, 2.0, 2.0, 3.5, 3.5, 4.5, 9.5, 10.0, 15.0, 5.0, np.nan, np.nan, 0.0, 0.0],
    index=stays.index,
    name="charge",
)
check_frame(
    result,
    expected,
    "charges follows the bands, counts every started hour after 240 minutes, caps the base at 10, applies the car park's factor and lets blue badges park free",
)
check_frame(stays, before, "charges does not change the stays")

one = pd.DataFrame({"car_park": ["leisure centre"], "minutes": [61], "blue_badge": [False]}, index=["only"])
check_frame(charges(one), pd.Series([1.0], index=["only"], name="charge"), "charges of a single stay")
