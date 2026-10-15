import numpy as np
import pandas as pd

index = ["mon", "tue", "wed", "thu", "fri", "sat", "sun", "extra", "late"]
till = pd.Series(
    [0.1 + 0.2 + 0.4, 250_000.00, 99.996, 20.004, np.nan, np.nan, 1e-9, 12.344, 0.0],
    index=index,
    name="till",
)
bank = pd.Series(
    [0.70, 250_000.01, 100.00, 20.006, 15.00, np.nan, 2e-9, 12.351, -0.004],
    index=index,
    name="bank",
)
till_before = till.copy()
bank_before = bank.copy()

result = reconcile(till, bank)
check_frame(
    result,
    pd.Series([True, False, True, True, False, False, True, False, True], index=index, name="matches"),
    "reconcile accepts differences up to half a penny at any size, rejects a penny on a large sum, "
    "is False where either amount is missing, and keeps the till's index",
)
check_frame(till, till_before, "reconcile does not change the till amounts")
check_frame(bank, bank_before, "reconcile does not change the bank amounts")
