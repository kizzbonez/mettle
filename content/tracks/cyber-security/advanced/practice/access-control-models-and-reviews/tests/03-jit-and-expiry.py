# Just-in-time grants (validity and window) and account expiry.
from datetime import datetime

policy = {
    "roles": {"ops": {"permissions": ["restart"], "hours": ["08:00", "18:00"]}},
    "users": {
        "ops1": {"roles": ["ops"], "expires": None},
        "ops2": {"roles": [], "expires": None},
        "temp": {"roles": ["ops"], "expires": "2027-02-28"},
    },
    "jit": [
        {"user": "ops1", "permission": "restart", "start": "2027-02-10T19:00", "minutes": 120, "ticket": "CHG-1"},
        {"user": "ops2", "permission": "db-admin", "start": "2027-02-10T10:00", "minutes": 121, "ticket": "CHG-2"},
        {"user": "ops2", "permission": "db-admin", "start": "2027-02-10T10:30", "minutes": 30, "ticket": ""},
        {"user": "ops2", "permission": "db-admin", "start": "2027-02-10T12:00", "minutes": 15, "ticket": "CHG-3"},
        {"user": "ops2", "permission": "db-admin", "start": "2027-02-10T12:10", "minutes": 60, "ticket": "CHG-4"},
        {"user": "temp", "permission": "restart", "start": "2027-03-01T09:00", "minutes": 60, "ticket": "CHG-5"},
        {"user": "ops1", "permission": "db-admin", "start": "2027-02-10T23:30", "minutes": 60, "ticket": "CHG-6"},
    ],
}
d = datetime
cases = [
    ("ops1", "restart", d(2027, 2, 10, 12, 0), ("allow", "role:ops"), "a role in its hours comes before a JIT grant"),
    ("ops1", "restart", d(2027, 2, 10, 19, 0), ("allow", "jit:CHG-1"), "the first minute of a JIT grant, outside the role's hours"),
    ("ops1", "restart", d(2027, 2, 10, 20, 59), ("allow", "jit:CHG-1"), "the last minute of a 120-minute grant"),
    ("ops1", "restart", d(2027, 2, 10, 21, 0), ("deny", "outside-hours"), "the end of a JIT grant, outside the role's hours"),
    ("ops1", "db-admin", d(2027, 2, 11, 0, 15), ("allow", "jit:CHG-6"), "a JIT grant running past midnight"),
    ("ops2", "db-admin", d(2027, 2, 10, 10, 5), ("deny", "not-granted"), "a grant of 121 minutes, over the limit"),
    ("ops2", "db-admin", d(2027, 2, 10, 10, 45), ("deny", "not-granted"), "a grant with an empty ticket"),
    ("ops2", "db-admin", d(2027, 2, 10, 12, 12), ("allow", "jit:CHG-3"), "two valid overlapping grants: the first in order"),
    ("ops2", "db-admin", d(2027, 2, 10, 12, 15), ("allow", "jit:CHG-4"), "the end of the first grant inside the second"),
    ("ops2", "restart", d(2027, 2, 10, 19, 30), ("deny", "not-granted"), "another user's grant"),
    ("temp", "restart", d(2027, 2, 28, 17, 59), ("allow", "role:ops"), "the last day of an account"),
    ("temp", "restart", d(2027, 3, 1, 9, 30), ("deny", "expired"), "an expired account with a JIT grant in its window"),
    ("temp", "restart", d(2027, 3, 1, 0, 0), ("deny", "expired"), "the first minute after an account's last day"),
]
for user, permission, at, expected, what in cases:
    assert tuple(decide(policy, user, permission, at)) == expected, f"decide for {what}"
