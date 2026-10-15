# The example from the instructions.
import numpy as np
import pandas as pd

metrics = department_metrics("data/campaign.csv")
expected = pd.DataFrame(
    {
        "sent": [3, 4, 3, 3],
        "click_rate": [0.33, 0.75, 0.33, 0.33],
        "submit_rate": [0.0, 0.5, 0.0, 0.0],
        "report_rate": [0.67, 0.5, 1.0, 0.33],
        "median_report_minutes": [10.0, 15.5, 4.0, 31.0],
    },
    index=pd.Index(["Estimating", "Finance", "Office", "Site Operations"], name="department"),
)
check_frame(metrics, expected, "department_metrics for data/campaign.csv", check_dtype=False)

scores = risk_scores("data/people.csv")
users = ["r.admin", "d.kim", "g.ivanova", "i.larsen", "h.mbeki", "e.santos", "f.walsh", "b.ozturk", "k.nowak"]
expected = pd.DataFrame(
    {
        "department": ["Office", "Finance", "Finance", "Site Operations", "Site Operations",
                       "Finance", "Finance", "Estimating", "Office"],
        "score": [100, 80, 55, 55, 35, 25, 20, 10, 0],
        "targeted_training": [True, True, True, True, False, False, False, False, False],
        "phishing_resistant_mfa": [True, True, False, False, False, False, False, False, False],
    },
    index=pd.Index(users, name="user"),
)
check_frame(scores, expected, "risk_scores for data/people.csv", check_dtype=False)

report = manager_report(scores)
expected = pd.DataFrame(
    {"people": [1, 4, 2, 2], "mean_score": [10.0, 45.0, 50.0, 45.0], "needs_training": [0, 2, 1, 1]},
    index=pd.Index(["Estimating", "Finance", "Office", "Site Operations"], name="department"),
)
check_frame(report, expected, "manager_report for the scores of data/people.csv", check_dtype=False)
