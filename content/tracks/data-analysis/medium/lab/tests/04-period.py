# completed_in_period: completed sessions only, both ends of the period included, a fresh index.
import pandas as pd

mar = add_cost(load_sessions("data/sessions-mar.csv"), load_prices("data/sites.json"))
before = mar.copy()
period = completed_in_period(mar, "2026-03-01 09:30", "2026-03-05 19:15")
assert isinstance(period, pd.DataFrame), "completed_in_period returns a DataFrame"
assert period["session_id"].tolist() == ["S2702", "S2703", "S2705", "S2707", "S2708", "S2709"], (
    "keeps the sessions with status ok started from start to end, both included, in their original order"
)
assert list(period.columns) == list(mar.columns), "the result has the same columns as the input"
assert isinstance(period.index, pd.RangeIndex) and period.index.tolist() == list(range(6)), (
    "the result is renumbered from 0"
)
assert period.dtypes.equals(mar.dtypes), "the columns keep their dtypes"
check_frame(mar, before, "completed_in_period leaves the frame it is given unchanged")

feb = load_sessions("data/sessions-feb.csv")
one_day = completed_in_period(feb, "2026-02-19 00:00", "2026-02-19 23:59")
assert one_day["session_id"].tolist() == ["S2641", "S2642", "S2644"], (
    "aborted and fault sessions are left out even inside the period"
)

empty = completed_in_period(mar, "2026-04-01 00:00", "2026-04-30 23:59")
assert len(empty) == 0 and list(empty.columns) == list(mar.columns), (
    "a period without sessions gives an empty frame with the same columns"
)
