# Your tests must pass on the correct functions and catch the two broken versions from the instructions.
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


for name in ["LateFeeTest", "SendRemindersTest"]:
    assert isinstance(globals().get(name), type) and issubclass(globals()[name], unittest.TestCase), (
        f"solution.py should define the class {name} as a subclass of unittest.TestCase"
    )

for case in [LateFeeTest, SendRemindersTest]:
    result = run_tests(case)
    problems = [str(test) for test, _ in result.failures + result.errors]
    assert result.wasSuccessful(), (
        f"every test in {case.__name__} should pass on the correct functions; these did not: {problems}"
    )


def late_fee_without_cap(days_late, per_day=25, cap=500):
    if days_late < 0:
        raise ValueError("days_late cannot be negative")
    return days_late * per_day


def send_to_everyone(loans, mailer):
    sent = 0
    for loan in loans:
        try:
            mailer.send(loan["email"], f"{loan['title']} is {loan['days_late']} days late")
        except ConnectionError:
            continue
        sent += 1
    return sent


assert not run_tests(LateFeeTest, late_fee=late_fee_without_cap).wasSuccessful(), (
    "LateFeeTest should fail when late_fee has no cap, but all its tests passed"
)
assert not run_tests(SendRemindersTest, send_reminders=send_to_everyone).wasSuccessful(), (
    "SendRemindersTest should fail when send_reminders also emails loans that are not overdue, but all its tests passed"
)
