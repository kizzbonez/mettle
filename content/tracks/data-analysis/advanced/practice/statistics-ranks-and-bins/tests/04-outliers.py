import numpy as np
import pandas as pd

at_fence = pd.Series([8.0, 2.0, 14.0, 6.0, 4.0], index=list("abcde"), name="kg")
before = at_fence.copy()
report = outlier_report(at_fence)
assert isinstance(report, pd.DataFrame), "outlier_report returns a DataFrame"
assert report.columns.tolist() == ["z", "iqr_outlier"], "outlier_report has the columns z and iqr_outlier"
check_frame(
    report,
    pd.DataFrame(
        {"z": [0.26, -1.04, 1.56, -0.17, -0.61], "iqr_outlier": [False, False, False, False, False]},
        index=at_fence.index,
    ),
    "a weight exactly on the upper fence is not an outlier, and z uses the sample standard deviation",
)
check_frame(at_fence, before, "outlier_report does not change the weights")

past_fence = pd.Series([8.0, 2.0, 14.5, 6.0, 4.0], index=list("abcde"), name="kg")
assert outlier_report(past_fence)["iqr_outlier"].tolist() == [False, False, True, False, False], (
    "a weight just past the upper fence is an outlier"
)

gaps = pd.Series([1.0, np.nan, 2.0, 3.0, 100.0, np.nan], index=[60, 50, 40, 30, 20, 10], name="kg")
check_frame(
    outlier_report(gaps),
    pd.DataFrame(
        {"z": [-0.52, np.nan, -0.5, -0.48, 1.5, np.nan], "iqr_outlier": [False, False, False, False, True, False]},
        index=gaps.index,
    ),
    "missing weights are left out of the statistics, get no z-score and are not outliers",
)

low = pd.Series([-30.0, 10.0, 11.0, 12.0, 13.0], name="kg")
assert outlier_report(low)["iqr_outlier"].tolist() == [True, False, False, False, False], "a weight below the lower fence is an outlier"
