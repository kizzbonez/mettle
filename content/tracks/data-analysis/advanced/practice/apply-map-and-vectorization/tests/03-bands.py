import pandas as pd

stays = pd.DataFrame(
    {
        "car_park": ["station"] * 9,
        "minutes": [241, 240, 121, 120, 31, 30, 1, 10000, 119],
        "blue_badge": [True, False, False, True, False, False, True, False, False],
    },
    index=["i", "h", "g", "f", "e", "d", "c", "b", "a"],
)
before = stays.copy()
result = stay_band(stays)
assert isinstance(result, pd.Series), "stay_band returns a Series"
check_frame(
    result,
    pd.Series(
        ["long", "half day", "half day", "short", "short", "quick", "quick", "long", "short"],
        index=stays.index,
        name="band",
    ),
    "stay_band puts each band's upper limit in that band, whatever the badge, and keeps the stays' index",
)
check_frame(stays, before, "stay_band does not change the stays")
