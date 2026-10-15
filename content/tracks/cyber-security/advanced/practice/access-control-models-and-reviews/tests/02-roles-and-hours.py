# Roles in order, hour windows with an included start and excluded end, windows past midnight.
from datetime import datetime

policy = {
    "roles": {
        "day": {"permissions": ["read", "write"], "hours": ["09:00", "17:30"]},
        "late": {"permissions": ["read"], "hours": ["22:00", "06:00"]},
        "always": {"permissions": ["read", "report"], "hours": None},
        "evening": {"permissions": ["write"], "hours": ["17:30", "23:00"]},
    },
    "users": {
        "u1": {"roles": ["day"], "expires": None},
        "u2": {"roles": ["late"], "expires": None},
        "u3": {"roles": ["day", "always"], "expires": None},
        "u4": {"roles": ["retired-role", "day"], "expires": None},
        "u5": {"roles": ["day", "evening"], "expires": None},
        "u6": {"roles": ["retired-role"], "expires": None},
    },
    "jit": [],
}
d = datetime
cases = [
    ("u1", "read", d(2027, 1, 4, 9, 0), ("allow", "role:day"), "the first minute of a day window"),
    ("u1", "read", d(2027, 1, 4, 17, 29), ("allow", "role:day"), "the last minute of a day window"),
    ("u1", "read", d(2027, 1, 4, 17, 30), ("deny", "outside-hours"), "the end of a day window"),
    ("u1", "read", d(2027, 1, 4, 8, 59), ("deny", "outside-hours"), "a minute before a day window"),
    ("u1", "report", d(2027, 1, 4, 12, 0), ("deny", "not-granted"), "a permission no role of the user has"),
    ("u2", "read", d(2027, 1, 4, 22, 0), ("allow", "role:late"), "the start of a window past midnight"),
    ("u2", "read", d(2027, 1, 5, 0, 0), ("allow", "role:late"), "midnight inside a window past midnight"),
    ("u2", "read", d(2027, 1, 5, 5, 59), ("allow", "role:late"), "the last minute of a window past midnight"),
    ("u2", "read", d(2027, 1, 5, 6, 0), ("deny", "outside-hours"), "the end of a window past midnight"),
    ("u2", "read", d(2027, 1, 5, 12, 0), ("deny", "outside-hours"), "midday, outside a window past midnight"),
    ("u3", "read", d(2027, 1, 4, 12, 0), ("allow", "role:day"), "two roles that both allow: the first in order"),
    ("u3", "read", d(2027, 1, 4, 3, 0), ("allow", "role:always"), "the first role outside its hours, the second without hours"),
    ("u4", "read", d(2027, 1, 4, 12, 0), ("allow", "role:day"), "a role missing from roles followed by a valid one"),
    ("u5", "write", d(2027, 1, 4, 17, 30), ("allow", "role:evening"), "one role's window ending as the next one starts"),
    ("u6", "read", d(2027, 1, 4, 12, 0), ("deny", "not-granted"), "a user whose only role is missing from roles"),
    ("nobody", "read", d(2027, 1, 4, 12, 0), ("deny", "unknown-user"), "a user not in users"),
]
for user, permission, at, expected, what in cases:
    assert tuple(decide(policy, user, permission, at)) == expected, f"decide for {what}"
