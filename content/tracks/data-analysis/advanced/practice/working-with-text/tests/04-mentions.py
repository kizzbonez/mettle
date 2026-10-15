import pandas as pd

notes = pd.Series(
    [
        "Buy 1+1 free at the spring fair",
        "11 seeds left",
        "germination 90%. (Organic)",
        None,
        "sow in a.m. only",
        "sow in arm-deep trenches",
        "ORGANIC and peat free",
    ],
    index=["n7", "n6", "n5", "n4", "n3", "n2", "n1"],
    name="notes",
)
before = notes.copy()

plus = mentions(notes, "1+1")
assert isinstance(plus, pd.Series), "mentions returns a Series"
assert plus.dtype == bool, "mentions returns a Series of bool"
check_frame(
    plus,
    pd.Series([True, False, False, False, False, False, False], index=notes.index, name="notes"),
    "mentions takes the phrase literally, not as a regular expression",
)
check_frame(
    mentions(notes, "a.m."),
    pd.Series([False, False, False, False, True, False, False], index=notes.index, name="notes"),
    "a dot in the phrase is a dot",
)
check_frame(
    mentions(notes, "(organic)"),
    pd.Series([False, False, True, False, False, False, False], index=notes.index, name="notes"),
    "brackets in the phrase are matched literally and case is ignored",
)
check_frame(
    mentions(notes, "Organic"),
    pd.Series([False, False, True, False, False, False, True], index=notes.index, name="notes"),
    "mentions ignores case and a missing note mentions nothing",
)
check_frame(notes, before, "mentions does not change the notes")
