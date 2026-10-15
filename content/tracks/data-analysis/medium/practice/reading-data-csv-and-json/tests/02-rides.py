from pathlib import Path

import numpy as np
import pandas as pd

Path("rides-may.csv").write_text(
    "Rides export, Velo Club Lindenberg\n"
    "Exported 01.06.2026, distances in km, climbing in m\n"
    "rider;ride_date;distance_km;climb_m;avg_speed_kmh;note\n"
    "099;03.05.2026;12,0;95;18,5;short\n"
    "010;04.05.2026;;2.310;-;forgot to start\n"
    "250;12.05.2026;140,25;10.250;22,75;\n"
    "007;31.05.2026;-;0;-;\n",
    encoding="utf-8",
)
rides = read_rides("rides-may.csv")
assert isinstance(rides, pd.DataFrame), "read_rides returns a DataFrame"
assert list(rides.columns) == ["rider", "ride_date", "distance_km", "climb_m", "avg_speed_kmh"], (
    "read_rides keeps the five columns of the instructions, without note"
)
dtypes = {column: str(dtype) for column, dtype in rides.dtypes.items()}
assert dtypes == {
    "rider": "str",
    "ride_date": "datetime64[us]",
    "distance_km": "float64",
    "climb_m": "int64",
    "avg_speed_kmh": "float64",
}, "each column of read_rides has the dtype in the instructions"
assert rides["rider"].tolist() == ["099", "010", "250", "007"], "rider numbers keep their leading zeros"
check_frame(
    rides["ride_date"],
    pd.Series(pd.to_datetime(["2026-05-03", "2026-05-04", "2026-05-12", "2026-05-31"]), name="ride_date"),
    "ride dates are read day first (03.05.2026 is the third of May)",
)
check_frame(
    rides["climb_m"],
    pd.Series([95, 2310, 10250, 0], name="climb_m"),
    "climbing is read with a dot grouping the thousands",
)
check_frame(
    rides["distance_km"],
    pd.Series([12.0, np.nan, 140.25, np.nan], name="distance_km"),
    "distances use a decimal comma, and an empty field or '-' is NaN",
)
check_frame(
    rides["avg_speed_kmh"],
    pd.Series([18.5, np.nan, 22.75, np.nan], name="avg_speed_kmh"),
    "average speeds use a decimal comma, and '-' is NaN",
)
assert isinstance(rides.index, pd.RangeIndex) and len(rides) == 4, "every ride is a row, numbered from 0"

Path("rides-one.csv").write_text(
    "Rides export\nnothing else to say\nrider;ride_date;distance_km;climb_m;avg_speed_kmh;note\n"
    "031;01.06.2026;1.002,5;8.848;30,1;everest\n",
    encoding="utf-8",
)
one = read_rides("rides-one.csv")
assert one.shape == (1, 5), "a file of one ride gives one row and five columns"
assert one["distance_km"].iloc[0] == 1002.5 and one["climb_m"].iloc[0] == 8848, (
    "a number with both a thousands dot and a decimal comma is read as one number"
)
