# manager_report: aggregates of a given scores table only, departments sorted, means rounded.
import pandas as pd

scores = pd.DataFrame(
    {
        "department": ["Yard", "Accounts", "Yard", "Accounts", "Accounts", "Yard"],
        "score": [64, 12, 23, 91, 40, 51],
        "targeted_training": [True, False, False, True, False, True],
        "phishing_resistant_mfa": [False, False, False, True, False, False],
    },
    index=pd.Index(["x1", "x2", "x3", "x4", "x5", "x6"], name="user"),
)
before = scores.copy()

got = manager_report(scores)
expected = pd.DataFrame(
    {"people": [3, 3], "mean_score": [47.7, 46.0], "needs_training": [1, 2]},
    index=pd.Index(["Accounts", "Yard"], name="department"),
)
check_frame(got, expected, "manager_report: people, mean score to 1 decimal and needs_training per department, nothing else",
            check_dtype=False)
check_frame(scores, before, "manager_report should not change the scores table it is given")
