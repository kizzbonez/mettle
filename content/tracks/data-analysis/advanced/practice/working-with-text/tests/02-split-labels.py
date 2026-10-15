import numpy as np
import pandas as pd

labels = pd.Series(
    [
        "  rad-2026-007",
        "CAR-2019-120  ",
        "TOMA-2025-014",
        "TOM-2025-0145",
        "TOM-25-014",
        "to-2025-014",
        "",
        None,
        "Kal-2021-000",
        "TOM 2025 014",
    ],
    index=[f"p{n}" for n in range(10)],
)
before = labels.copy()
result = split_labels(labels)
assert isinstance(result, pd.DataFrame), "split_labels returns a DataFrame"
assert result.columns.tolist() == ["crop", "year", "number"], "split_labels has the columns crop, year and number"
expected = pd.DataFrame(
    {
        "crop": ["RAD", "CAR", None, None, None, None, None, None, "KAL", None],
        "year": [2026.0, 2019.0] + [np.nan] * 6 + [2021.0, np.nan],
        "number": ["007", "120", None, None, None, None, None, None, "000", None],
    },
    index=labels.index,
)
check_frame(
    result,
    expected,
    "split_labels cleans spaces and case, takes only labels that are exactly the pattern, keeps leading zeros and makes year a float",
)
check_frame(labels, before, "split_labels does not change the labels")

one = split_labels(pd.Series(["owl-2020-001"]))
check_frame(
    one,
    pd.DataFrame({"crop": ["OWL"], "year": [2020.0], "number": ["001"]}),
    "a single valid label",
)
