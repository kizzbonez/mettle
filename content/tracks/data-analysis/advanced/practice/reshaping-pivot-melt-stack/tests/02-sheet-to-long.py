import numpy as np
import pandas as pd

sheet = pd.DataFrame(
    {
        "runner": ["Yan", "Kofi", "Ines", "Bo"],
        "W12": [3.0, np.nan, 0.0, np.nan],
        "W10": [np.nan, 7.5, 4.25, np.nan],
        "W11": [5.5, 2.0, np.nan, np.nan],
    },
    index=[40, 30, 20, 10],
)
before = sheet.copy()
result = sheet_to_long(sheet)
assert isinstance(result, pd.DataFrame), "sheet_to_long returns a DataFrame"
assert result.columns.tolist() == ["runner", "week", "km"], "sheet_to_long has the columns runner, week and km"
expected = pd.DataFrame(
    {
        "runner": ["Ines", "Ines", "Kofi", "Kofi", "Yan", "Yan"],
        "week": ["W10", "W12", "W10", "W11", "W11", "W12"],
        "km": [4.25, 0.0, 7.5, 2.0, 5.5, 3.0],
    }
)
check_frame(
    result,
    expected,
    "sheet_to_long keeps every reported distance (0 included), drops gaps, sorts by runner then week, index 0, 1, 2, ...",
)
check_frame(sheet, before, "sheet_to_long does not change the sheet")

one_week = sheet_to_long(sheet[["runner", "W11"]])
check_frame(
    one_week,
    pd.DataFrame({"runner": ["Kofi", "Yan"], "week": ["W11", "W11"], "km": [2.0, 5.5]}),
    "a sheet with one week column",
)

no_weeks = sheet_to_long(sheet[["runner"]])
assert isinstance(no_weeks, pd.DataFrame) and len(no_weeks) == 0, "a sheet without week columns gives no rows"
assert no_weeks.columns.tolist() == ["runner", "week", "km"], "an empty result still has the columns runner, week and km"
