# Consent filtering, the exact keys of each record, and keyed pseudonyms.
import hashlib
import hmac


def row(customer_id="C-1", consent="yes", **changes):
    base = {"customer_id": customer_id, "full_name": "Test Person", "email": "t@mail.example", "phone": "07700 900000",
            "postcode": "BS1 4DJ", "birth_date": "1990-01-01", "card_number": "", "plan": "fibre-100",
            "monthly_spend": "30.00", "research_consent": consent, "notes": "lives with her sister"}
    base.update(changes)
    return base


KEY = b"test-key-02"
consents = ["yes", "YES", " Yes ", "\tyes", "no", "", "y", "yes please", "true", "1"]
kept = protect([row(f"C-{n}", consent) for n, consent in enumerate(consents)], KEY)
pids = [record["pid"] for record in kept]
expected = [hmac.new(KEY, f"C-{n}".encode(), hashlib.sha256).hexdigest()[:12] for n in range(4)]
assert pids == expected, "protect keeps exactly the rows whose consent is yes in any case with spaces around it, in order"

record = protect([row()], KEY)[0]
assert list(record) == ["pid", "area", "age_band", "card", "plan", "monthly_spend"], (
    "each record has exactly the keys pid, area, age_band, card, plan, monthly_spend in this order"
)
assert "lives with her sister" not in record.values(), "the free-text notes are not copied"

same = protect([row(" C-77 "), row("C-77")], KEY)
assert same[0]["pid"] == same[1]["pid"], "customer_id is used without surrounding spaces, so the pseudonym is stable"
other = protect([row("C-77")], b"another-key")[0]["pid"]
assert other != same[0]["pid"], "a different key gives a different pseudonym"
plain = hashlib.sha256(b"C-77").hexdigest()[:12]
assert same[0]["pid"] != plain, "the pseudonym is a keyed HMAC, not a plain SHA-256 anyone could recompute"
assert len(same[0]["pid"]) == 12 and all(ch in "0123456789abcdef" for ch in same[0]["pid"]), (
    "the pseudonym is 12 lower-case hex characters"
)
assert protect([], KEY) == [], "protect of no rows"
