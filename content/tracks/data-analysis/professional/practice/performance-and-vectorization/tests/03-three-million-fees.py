# Three million stays priced under eight tariffs: only whole-column code finishes in time.
import numpy as np
import pandas as pd

rng = np.random.default_rng(31)
n = 3_000_000
stays = pd.DataFrame({
    "car_park": rng.integers(1, 2_001, n, dtype=np.int32),
    "minutes": rng.integers(1, 1_500, n, dtype=np.int32),
    "entry_hour": rng.integers(0, 24, n, dtype=np.int8),
})
stays.index = stays.index + 700_000
known = np.arange(1, 2_001)[rng.random(2_000) < 0.97]
sample = np.sort(rng.choice(n, 20_000, replace=False))
part = stays.iloc[sample]


def expected_fees(stays, tariffs):
    rate = stays["car_park"].map(tariffs.set_index("car_park")["per_hour"])
    day = np.minimum(np.ceil(stays["minutes"] / 60) * rate, 15.0)
    night = (stays["entry_hour"] >= 22) | (stays["entry_hour"] < 6)
    fee = np.where(stays["minutes"] <= 20, 0.0, np.where(night, 4.0, day))
    return pd.Series(fee, index=stays.index, name="fee").round(2)


for tariff in range(8):
    tariffs = pd.DataFrame({"car_park": known, "per_hour": (rng.integers(20, 80, len(known)) * 0.05).round(2)})
    result = fees(stays, tariffs)
    assert isinstance(result, pd.Series) and len(result) == n, "fees returns one fee for each of three million stays"
    check_frame(result.index, stays.index, "the fees of three million stays keep the stays' index")
    if tariff == 0:
        check_frame(result, expected_fees(stays, tariffs), "fees prices three million stays correctly")
    else:
        check_frame(result.iloc[sample], expected_fees(part, tariffs), "fees prices three million stays correctly")
    del result
