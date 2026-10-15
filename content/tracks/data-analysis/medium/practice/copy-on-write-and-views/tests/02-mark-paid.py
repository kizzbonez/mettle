import pandas as pd

plots = pd.DataFrame(
    {
        "plot": ["A1", "A2", "B1", "B2", "C1", "C2"],
        "holder": ["Ng", "Silva", "Ng", "Ng", "Brown", "Silva"],
        "size_m2": [60, 125, 125, 250, 60, 60],
        "rent": [18.0, 32.5, 32.5, 60.0, 18.0, 18.0],
        "paid": [False, False, True, False, False, True],
    },
    index=[101, 102, 201, 202, 301, 302],
)
register = plots
expected = plots.copy()
expected.loc[[101, 201, 202], "paid"] = True

result = mark_paid(plots, "Ng")
assert result is None, "mark_paid returns None"
assert plots is register, "mark_paid changes the frame it is given, not a new one"
check_frame(plots, expected, "mark_paid sets paid for every plot of the holder in plots itself, and changes nothing else")
assert str(plots["paid"].dtype) == "bool", "paid stays a bool column"

unchanged = plots.copy()
mark_paid(plots, "Kowalski")
check_frame(plots, unchanged, "a holder with no plots changes nothing")

mark_paid(plots, "Silva")
assert plots["paid"].tolist() == [True, True, True, True, False, True], "a second call marks another holder's plots"

single = pd.DataFrame({"plot": ["Z9"], "holder": ["Ito"], "size_m2": [60], "rent": [18.0], "paid": [False]})
mark_paid(single, "Ito")
assert single["paid"].tolist() == [True], "a register of one plot is changed too"
