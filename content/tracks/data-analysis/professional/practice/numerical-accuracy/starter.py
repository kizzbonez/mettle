"""Shop Books: exact pence, safe totals and a fair reconciliation for the village shop.

Every `raise NotImplementedError` marks code you still have to write.
Keep the function names and parameters: the tests call them.
"""

from decimal import ROUND_HALF_UP, Decimal

import numpy as np
import pandas as pd

PENNY = Decimal("0.01")
HALF_PENNY = 0.005


def to_pence(prices):
    """Prices written as text in pounds, as whole pence (int64), halves rounded away from zero."""
    # A float cannot hold 2.675 exactly: build a Decimal from each string instead.
    raise NotImplementedError


def line_totals(quantity, unit_pence):
    """quantity * unit_pence for each line, in int64 so that nothing wraps around."""
    raise NotImplementedError


def reconcile(till, bank):
    """True where the till and the bank agree to within half a penny; False where either is missing."""
    raise NotImplementedError
