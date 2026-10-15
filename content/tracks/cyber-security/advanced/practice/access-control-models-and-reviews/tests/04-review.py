# review: expiry dates against the review date, separation of duties and invalid JIT grants.
from datetime import date

policy = {
    "roles": {
        "stores": {"permissions": ["order-stock", "receive-stock"], "hours": None},
        "buyer": {"permissions": ["order-stock"], "hours": ["08:00", "17:00"]},
        "goods-in": {"permissions": ["receive-stock"], "hours": ["06:00", "14:00"]},
        "lead": {"permissions": ["approve-controlled", "view-audit"], "hours": None},
    },
    "users": {
        "gone-no-roles": {"roles": [], "expires": "2026-12-01"},
        "ends-today": {"roles": ["buyer"], "expires": "2027-01-15"},
        "ended-yesterday": {"roles": ["goods-in"], "expires": "2027-01-14"},
        "one-role-both": {"roles": ["stores"], "expires": None},
        "two-roles": {"roles": ["goods-in", "ghost", "buyer"], "expires": None},
        "everything": {"roles": ["lead", "stores"], "expires": "2026-06-30"},
        "ghost-only": {"roles": ["ghost"], "expires": "2026-01-01"},
    },
    "jit": [
        {"user": "ends-today", "permission": "order-stock", "start": "2027-01-10T09:00", "minutes": 120, "ticket": "CHG-10"},
        {"user": "two-roles", "permission": "view-audit", "start": "2027-01-11T09:00", "minutes": 600, "ticket": ""},
        {"user": "two-roles", "permission": "order-stock", "start": "2027-01-12T09:00", "minutes": 121, "ticket": "CHG-11"},
    ],
}
got = review(policy, date(2027, 1, 15))
assert got == [
    "EXPIRED ended-yesterday 2027-01-14",
    "SOD one-role-both order-stock+receive-stock",
    "SOD two-roles order-stock+receive-stock",
    "EXPIRED everything 2026-06-30",
    "SOD everything order-stock+receive-stock",
    "SOD everything approve-controlled+view-audit",
    "EXPIRED ghost-only 2026-01-01",
    "JIT-INVALID two-roles view-audit no-ticket",
    "JIT-INVALID two-roles order-stock too-long",
], (
    "review: expired accounts with roles (not on their last day), conflicts from one or several roles in CONFLICTS order, "
    "and invalid grants (an empty ticket before a long one)"
)

empty = {"roles": {}, "users": {}, "jit": []}
assert review(empty, date(2027, 1, 15)) == [], "review of an empty policy"
