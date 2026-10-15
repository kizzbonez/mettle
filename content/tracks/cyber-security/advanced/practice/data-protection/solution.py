"""De-identification of Lumen Telecom's customer records before they go to the analytics firm."""
import hashlib
import hmac
from collections import Counter
from datetime import date

REFERENCE_DATE = date(2026, 12, 1)


def age_band(birth_date):
    born = date.fromisoformat(birth_date.strip())
    age = REFERENCE_DATE.year - born.year
    if (REFERENCE_DATE.month, REFERENCE_DATE.day) < (born.month, born.day):
        age -= 1
    if age >= 90:
        return "90+"
    low = age // 10 * 10
    return f"{low}-{low + 9}"


def mask_card(number):
    digits = "".join(ch for ch in number if ch not in " -")
    if not digits:
        return ""
    return "*" * (len(digits) - 4) + digits[-4:]


def protect(rows, key):
    """Return the shareable records: consent filter, then pid, area, age_band, card, plan, monthly_spend."""
    records = []
    for row in rows:
        if row["research_consent"].strip().lower() != "yes":
            continue
        records.append({
            "pid": hmac.new(key, row["customer_id"].strip().encode(), hashlib.sha256).hexdigest()[:12],
            "area": row["postcode"].replace(" ", "").upper()[:-3],
            "age_band": age_band(row["birth_date"]),
            "card": mask_card(row["card_number"]),
            "plan": row["plan"],
            "monthly_spend": row["monthly_spend"],
        })
    return records


def small_groups(records, k):
    """Return sorted (area, age_band, count) tuples for the combinations held by fewer than k records."""
    counts = Counter((record["area"], record["age_band"]) for record in records)
    return sorted((area, band, count) for (area, band), count in counts.items() if count < k)
