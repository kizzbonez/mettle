import numpy as np
import pandas as pd

expected_rides = pd.DataFrame(
    {
        "rider": ["007", "012", "007", "031", "012", "100", "031", "045", "007", "012"],
        "ride_date": pd.to_datetime(
            [
                "2026-04-02", "2026-04-02", "2026-04-05", "2026-04-06", "2026-04-11",
                "2026-04-12", "2026-04-13", "2026-04-18", "2026-04-19", "2026-04-26",
            ]
        ),
        "distance_km": [42.5, 68.0, np.nan, 105.3, 55.2, 23.9, 88.1, 61.4, 47.0, 120.6],
        "climb_m": [1120, 860, 640, 2045, 710, 310, 1530, 905, 1205, 1870],
        "avg_speed_kmh": [24.8, 27.1, np.nan, 25.6, 28.4, 19.7, 26.0, 24.3, 23.9, np.nan],
    }
)
check_frame(read_rides("data/rides.csv"), expected_rides, "read_rides of data/rides.csv: columns, values and dtypes")

expected_members = pd.DataFrame(
    {
        "name": ["Anna Huber", "Lukas Brandt", "Mia Novak", "Zoë Fischer", "Jonas Weber"],
        "group": ["road", "gravel", "road", "gravel", "mountain"],
    },
    index=pd.Index(["007", "012", "031", "045", "100"], name="member"),
)
check_frame(read_members("data/members.csv"), expected_members, "read_members of data/members.csv: index, columns and values")

expected_checks = pd.DataFrame(
    {
        "bike_id": ["0042", "0107", "0230", "0042", "0315"],
        "member": ["007", "012", "031", "007", "100"],
        "checked_at": pd.to_datetime(
            ["2026-04-01 18:30", "2026-04-01 18:45", "2026-04-08 19:05", "2026-04-22 18:10", "2026-04-22 18:40"]
        ),
        "brakes_ok": [True, False, True, True, False],
        "tyre_mm": [2.5, 1.1, np.nan, 2.2, 0.8],
    }
)
check_frame(read_checks("data/checks.jsonl"), expected_checks, "read_checks of data/checks.jsonl: columns, values and dtypes")
