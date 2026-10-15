import numpy as np
import pandas as pd

spring = price_list({"clover": 6.5, "heather": 8.0, "wildflower": 7.0})
check_frame(
    spring,
    pd.Series([6.5, 8.0, 7.0], index=["clover", "heather", "wildflower"], name="price"),
    "price_list of the spring prices, as in the example",
)
autumn = price_list({"heather": 8.5, "clover": 6.5, "borage": 9.0})
check_frame(
    price_changes(spring, autumn),
    pd.Series([np.nan, 0.0, 0.5, np.nan], index=["borage", "clover", "heather", "wildflower"], name="price"),
    "price_changes(spring, autumn), as in the example",
)

day = market_day(
    [
        {"honey": "clover", "price": 6.5, "sold": 12},
        {"honey": "heather", "price": 8.0, "sold": 5, "note": "last jars"},
        {"honey": "wildflower", "price": 7.0, "sold": 9},
    ]
)
check_frame(
    day,
    pd.DataFrame(
        {
            "honey": ["clover", "heather", "wildflower"],
            "price": [6.5, 8.0, 7.0],
            "sold": [12, 5, 9],
            "note": [np.nan, "last jars", np.nan],
        }
    ),
    "market_day of the example sales",
)
assert abs(takings(day) - 181.0) < 1e-9, "takings of the example day"
assert text_columns(day) == ["honey", "note"], "text_columns of the example day"
