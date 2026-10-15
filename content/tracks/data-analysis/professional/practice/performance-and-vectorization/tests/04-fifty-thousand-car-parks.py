# Two million stays across fifty thousand car parks, in shuffled order: look the rates up, do not scan.
import numpy as np
import pandas as pd

rng = np.random.default_rng(47)
n = 2_000_000
ids = rng.choice(np.arange(100_000, 1_000_000), 50_000, replace=False)
stays = pd.DataFrame(
    {
        "car_park": rng.choice(ids, n),
        "minutes": rng.integers(1, 1_500, n, dtype=np.int32),
        "entry_hour": rng.integers(0, 24, n, dtype=np.int8),
    },
    index=rng.permutation(n) + 20_000_000,
)

for tariff in range(4):
    tariffs = pd.DataFrame({"car_park": rng.permutation(ids)[:49_000]})
    tariffs["per_hour"] = (rng.integers(20, 80, len(tariffs)) * 0.05).round(2)
    expected = stays["car_park"].map(tariffs.set_index("car_park")["per_hour"]).rename("per_hour")
    check_frame(
        hourly_rates(stays, tariffs),
        expected,
        "hourly_rates finds the rates of two million stays among fifty thousand car parks, "
        "lined up with the stays' shuffled index",
    )
