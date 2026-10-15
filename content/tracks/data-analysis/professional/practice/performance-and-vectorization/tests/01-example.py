import numpy as np
import pandas as pd

tariffs = pd.DataFrame({"car_park": [1, 2, 3], "per_hour": [1.80, 2.40, 1.25]})
stays = pd.DataFrame({
    "car_park": [1, 1, 2, 2, 3, 9, 3],
    "minutes": [15, 75, 130, 600, 200, 45, 61],
    "entry_hour": [10, 9, 14, 8, 23, 12, 6],
})

check_frame(
    hourly_rates(stays, tariffs),
    pd.Series([1.80, 1.80, 2.40, 2.40, 1.25, np.nan, 1.25], name="per_hour"),
    "hourly_rates looks up the example's rates, NaN for the car park without a tariff",
)
check_frame(
    fees(stays, tariffs),
    pd.Series([0.0, 3.60, 7.20, 15.00, 4.00, np.nan, 2.50], name="fee"),
    "fees prices the example's stays",
)
