# department_metrics: flags with spaces and capitals, minutes of non-reporters, nobody reporting.
import numpy as np
import pandas as pd

with open("t2-campaign.csv", "w") as f:
    f.write(
        "user,department,opened,clicked,submitted,reported,minutes_to_report\n"
        "u1,Design, Yes ,YES,no,yes,12\n"
        "u2,Design,yes,No,no, yes ,4\n"
        "\n"
        "u3,Design,no,no,no,no,\n"
        "u4,Plant,yes,yes,YES,no,7\n"
        "u5,Plant,yes,y,no,no,\n"
        "u6,Legal,yes,no,no,Yes,2\n"
    )

got = department_metrics("t2-campaign.csv")
expected = pd.DataFrame(
    {
        "sent": [3, 1, 2],
        "click_rate": [0.33, 0.0, 0.5],
        "submit_rate": [0.0, 0.0, 0.5],
        "report_rate": [0.67, 1.0, 0.0],
        "median_report_minutes": [8.0, 2.0, np.nan],
    },
    index=pd.Index(["Design", "Legal", "Plant"], name="department"),
)
check_frame(
    got, expected,
    "department_metrics with messy flags, minutes from people who did not report, and a department where nobody reported",
    check_dtype=False,
)
