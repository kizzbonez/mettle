import numpy as np
import pandas as pd

sales = [
    {"honey": "acacia", "price": 9.5, "sold": 4},
    {"honey": "borage", "price": 8.75, "sold": 0, "note": "rain"},
    {"honey": "manuka", "price": 24.0, "sold": 2, "note": "sold out"},
    {"honey": "clover", "price": 6.5, "sold": 15},
]
day = market_day(sales)
assert isinstance(day, pd.DataFrame), "market_day returns a DataFrame"
assert day.shape == (4, 4), "market_day has one row per record and one column per key"
assert list(day.columns) == ["honey", "price", "sold", "note"], "the columns are the keys in the order they first appear"
assert isinstance(day.index, pd.RangeIndex) and list(day.index) == [0, 1, 2, 3], "the rows are numbered from 0"
assert day["honey"].tolist() == ["acacia", "borage", "manuka", "clover"], "the rows keep the order of the list"
assert day["note"].isna().tolist() == [True, False, False, True], "a record without a note is NaN in note"
assert abs(takings(day) - 183.5) < 1e-9, "takings adds price times sold over every row"

first_note = market_day(
    [
        {"honey": "heather", "note": "new label", "price": 8.0, "sold": 3},
        {"honey": "clover", "price": 6.5, "sold": 1},
    ]
)
assert list(first_note.columns) == ["honey", "note", "price", "sold"], "a key that comes earlier in the first record comes earlier in the columns"
assert abs(takings(first_note) - 30.5) < 1e-9, "takings works whatever the column order"

one = market_day([{"honey": "manuka", "price": 24.0, "sold": 3}])
assert one.shape == (1, 3), "a single record gives one row"
assert abs(takings(one) - 72.0) < 1e-9, "takings of a single sale"

none_sold = pd.DataFrame({"honey": [], "price": [], "sold": []})
assert takings(none_sold) == 0, "a day with no rows took 0"
