import pandas as pd

hives = pd.DataFrame(
    {
        "hive": ["H1", "H2", "H3"],
        "frames": [10, 8, 12],
        "weight_kg": [31.5, 24.0, 40.2],
        "queen_seen": [True, False, True],
        "apiary": ["orchard", "orchard", "meadow"],
        "batch": ["07", "12", "31"],
    }
)
assert text_columns(hives) == ["hive", "apiary", "batch"], (
    "text_columns lists every str column in column order, including text that looks like numbers"
)

numbers = pd.DataFrame({"frames": [10, 8], "weight_kg": [31.5, 24.0], "queen_seen": [True, False]})
assert text_columns(numbers) == [], "a frame without text columns gives an empty list"

with_gaps = pd.DataFrame([{"jar": "small", "price": 4.0}, {"price": 7.0, "label": "gift"}])
assert text_columns(with_gaps) == ["jar", "label"], "a str column with missing values is still a text column"

result = text_columns(pd.DataFrame({"honey": ["clover"]}))
assert isinstance(result, list), "text_columns returns a list"
assert result == ["honey"], "a frame of one text column"
