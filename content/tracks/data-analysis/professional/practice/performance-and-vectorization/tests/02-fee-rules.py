import numpy as np
import pandas as pd

tariffs = pd.DataFrame({"car_park": [7, 3, 4], "per_hour": [2.00, 1.50, 1.333]})
stays = pd.DataFrame(
    {
        "car_park": [3, 3, 3, 3, 3, 7, 7, 7, 7, 7, 5, 5, 5, 7, 4],
        "minutes": [20, 21, 60, 61, 1440, 30, 30, 30, 30, 500, 300, 10, 300, 450, 90],
        "entry_hour": [12, 12, 12, 12, 12, 22, 5, 6, 21, 0, 12, 23, 23, 7, 15],
    },
    index=[5012, 5003, 5040, 5001, 5100, 5020, 5007, 5033, 5002, 5090, 5011, 5004, 5050, 5060, 5005],
)
stays_before = stays.copy()
tariffs_before = tariffs.copy()

check_frame(
    hourly_rates(stays, tariffs),
    pd.Series(
        [1.5] * 5 + [2.0] * 5 + [np.nan] * 3 + [2.0, 1.333],
        index=stays.index,
        name="per_hour",
    ),
    "hourly_rates gives each stay its car park's rate, NaN for unknown car parks, with the stays' own index",
)
check_frame(
    fees(stays, tariffs),
    pd.Series(
        [0.0, 1.5, 1.5, 3.0, 15.0, 4.0, 4.0, 2.0, 2.0, 4.0, np.nan, 0.0, 4.0, 15.0, 2.67],
        index=stays.index,
        name="fee",
    ),
    "fees applies the free 20 minutes, started hours, the night flat fee, the cap, unknown car parks and "
    "rounding, with the stays' own index",
)
check_frame(stays, stays_before, "hourly_rates and fees do not change the stays")
check_frame(tariffs, tariffs_before, "hourly_rates and fees do not change the tariffs")

empty = stays.iloc[:0]
assert isinstance(fees(empty, tariffs), pd.Series) and len(fees(empty, tariffs)) == 0, (
    "no stays give an empty Series of fees"
)
assert len(hourly_rates(empty, tariffs)) == 0, "no stays give an empty Series of rates"
