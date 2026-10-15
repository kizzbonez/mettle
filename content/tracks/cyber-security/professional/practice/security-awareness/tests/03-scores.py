# risk_scores: the 0 and 100 bounds, the DLP cap, counts above 1, thresholds at 50 and 70, ties.
import pandas as pd

with open("t3-people.csv", "w") as f:
    f.write(
        "user,department,submitted_90d,clicked_90d,reported_90d,training_overdue,privileged,handles_payments,dlp_events_90d\n"
        "u1,Plant,0,0,0,yes,yes,yes,0\n"
        "u2,Plant,0,0,0,Yes,YES,yes,2\n"
        "u3,Design,1,0,0,no,yes,no,3\n"
        "u4,Design,0,0,4,no,no,no,0\n"
        "u5,Legal,2,3,0,yes,yes,yes,5\n"
        "u6,Legal,0,3,1,YES,no,no,0\n"
        "u7,Design,2,2,1,no,no, yes ,0\n"
        "aa.first,Plant,0,1,0,no,no,no,0\n"
        "u8,Design,0,0,0,no,no,no,6\n"
    )

got = risk_scores("t3-people.csv")
expected = pd.DataFrame(
    {
        "department": ["Legal", "Design", "Plant", "Plant", "Design", "Design", "Plant", "Legal", "Design"],
        "score": [100, 80, 70, 50, 40, 30, 10, 10, 0],
        "targeted_training": [True, True, True, False, False, False, False, False, False],
        "phishing_resistant_mfa": [True, True, False, False, False, False, False, False, False],
    },
    index=pd.Index(["u5", "u3", "u2", "u1", "u7", "u8", "aa.first", "u6", "u4"], name="user"),
)
check_frame(
    got, expected,
    "risk_scores: totals kept between 0 and 100, DLP at most 30, signals counted once, thresholds above 50 and 70, ties by user",
    check_dtype=False,
)
