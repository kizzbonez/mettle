"""De-identification of Lumen Telecom's customer records before they go to the analytics firm."""
import hashlib
import hmac
from collections import Counter
from datetime import date

REFERENCE_DATE = date(2026, 12, 1)


def protect(rows, key):
    """Return the shareable records: consent filter, then pid, area, age_band, card, plan, monthly_spend."""
    # YOUR CODE: keyed-hash pseudonym, outward postcode, ten-year age band, masked card.
    raise NotImplementedError


def small_groups(records, k):
    """Return sorted (area, age_band, count) tuples for the combinations held by fewer than k records."""
    # YOUR CODE
    raise NotImplementedError
