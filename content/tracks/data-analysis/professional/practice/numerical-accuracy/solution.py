"""Shop Books: exact pence, safe totals and a fair reconciliation for the village shop."""

from decimal import ROUND_HALF_UP, Decimal

import numpy as np
import pandas as pd

PENNY = Decimal("0.01")
HALF_PENNY = 0.005


def to_pence(prices):
    """Prices written as text in pounds, as whole pence (int64), halves rounded away from zero."""
    def pence(text):
        return int(Decimal(text).quantize(PENNY, rounding=ROUND_HALF_UP) * 100)

    return prices.map(pence).astype("int64")


def line_totals(quantity, unit_pence):
    """quantity * unit_pence for each line, in int64 so that nothing wraps around."""
    return (quantity.astype("int64") * unit_pence.astype("int64")).rename("total_pence")


def reconcile(till, bank):
    """True where the till and the bank agree to within half a penny; False where either is missing."""
    close = np.isclose(till, bank, rtol=0, atol=HALF_PENNY)
    return pd.Series(close, index=till.index, name="matches")
