# LateFeeTest must pass on the correct late_fee and fail on each broken one.
import io
import sys
import unittest
from unittest import mock

solution_module = sys.modules["solution"]


def correct_late_fee(days_late, per_day=25, cap=500):
    if days_late < 0:
        raise ValueError("days_late cannot be negative")
    return min(days_late * per_day, cap)


def correct_send_reminders(loans, mailer):
    sent = 0
    for loan in loans:
        if loan["days_late"] <= 0:
            continue
        try:
            mailer.send(loan["email"], f"{loan['title']} is {loan['days_late']} days late")
        except ConnectionError:
            continue
        sent += 1
    return sent


def run_tests(case, **replacements):
    """Run one of the learner's TestCase classes with the functions swapped; return the result."""
    functions = {"late_fee": correct_late_fee, "send_reminders": correct_send_reminders}
    functions.update(replacements)
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(case)
    with mock.patch.multiple(solution_module, **functions):
        return unittest.TextTestRunner(stream=io.StringIO(), verbosity=0).run(suite)


assert run_tests(LateFeeTest).wasSuccessful(), "every test in LateFeeTest should pass on the correct late_fee"


def accepts_negative_days(days_late, per_day=25, cap=500):
    return max(min(days_late * per_day, cap), 0)


def first_day_free(days_late, per_day=25, cap=500):
    if days_late < 0:
        raise ValueError("days_late cannot be negative")
    return min(max(days_late - 1, 0) * per_day, cap)


def ignores_per_day(days_late, per_day=25, cap=500):
    if days_late < 0:
        raise ValueError("days_late cannot be negative")
    return min(days_late * 25, cap)


def ignores_cap_argument(days_late, per_day=25, cap=500):
    if days_late < 0:
        raise ValueError("days_late cannot be negative")
    return min(days_late * per_day, 500)


def rejects_on_time(days_late, per_day=25, cap=500):
    if days_late <= 0:
        raise ValueError("days_late must be positive")
    return min(days_late * per_day, cap)


mistakes = {
    "accepts a negative number of days instead of raising ValueError": accepts_negative_days,
    "charges nothing for the first late day": first_day_free,
    "always charges 25 a day, whatever per_day is": ignores_per_day,
    "always caps at 500, whatever cap is": ignores_cap_argument,
    "raises ValueError for a book returned on time": rejects_on_time,
}
for mistake, broken in mistakes.items():
    assert not run_tests(LateFeeTest, late_fee=broken).wasSuccessful(), (
        f"LateFeeTest should fail when late_fee {mistake}, but all its tests passed"
    )
