import numpy as np
import pandas as pd

mostly_gaps = pd.Series(["dvd", "book", "book", "dvd", None, None, None])
before = mostly_gaps.copy()
report = category_report(mostly_gaps)
assert report["distinct"] == 2, "distinct does not count missing values"
assert report["missing"] == 3, "missing counts the gaps"
assert report["top"] == "dvd", "a missing value is never the top, and a tie goes to the value that appears first"
assert abs(report["top_share"] - 0.5) < 1e-9, "top_share is a share of the values present, not of all rows"
check_frame(mostly_gaps, before, "category_report does not change the column")

single = category_report(pd.Series(["Central"] * 5))
assert single["distinct"] == 1 and single["missing"] == 0, "a column of one value has one distinct value and no gaps"
assert single["top"] == "Central" and abs(single["top_share"] - 1.0) < 1e-9, "a column of one value: that value, with a share of 1"

ratings = category_report(pd.Series([5.0, 3.0, np.nan, 3.0, 4.0, 5.0, 3.0]))
assert ratings["distinct"] == 3 and ratings["missing"] == 1, "numbers with a gap: distinct values and gaps"
assert ratings["top"] == 3.0, "the most common number is the top"
assert abs(ratings["top_share"] - 0.5) < 1e-9, "top_share of a numeric column"

thirds = category_report(pd.Series(["a", "b", "c", "b", "c", "a", "c"]))
assert thirds["top"] == "c", "the most common value wins over values seen earlier"
assert abs(thirds["top_share"] - 0.429) < 1e-9, "top_share is rounded to 3 decimals"
