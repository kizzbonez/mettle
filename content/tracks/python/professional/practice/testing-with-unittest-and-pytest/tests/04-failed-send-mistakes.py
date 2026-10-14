# SendRemindersTest must use side_effect to check what happens when sending fails.
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


assert run_tests(SendRemindersTest).wasSuccessful(), (
    "every test in SendRemindersTest should pass on the correct send_reminders"
)


def lets_the_error_escape(loans, mailer):
    sent = 0
    for loan in loans:
        if loan["days_late"] <= 0:
            continue
        mailer.send(loan["email"], f"{loan['title']} is {loan['days_late']} days late")
        sent += 1
    return sent


def stops_at_the_first_failure(loans, mailer):
    sent = 0
    for loan in loans:
        if loan["days_late"] <= 0:
            continue
        try:
            mailer.send(loan["email"], f"{loan['title']} is {loan['days_late']} days late")
        except ConnectionError:
            break
        sent += 1
    return sent


def counts_failed_emails(loans, mailer):
    sent = 0
    for loan in loans:
        if loan["days_late"] <= 0:
            continue
        sent += 1
        try:
            mailer.send(loan["email"], f"{loan['title']} is {loan['days_late']} days late")
        except ConnectionError:
            continue
    return sent


mistakes = {
    "lets the ConnectionError escape": lets_the_error_escape,
    "stops at the first failed email": stops_at_the_first_failure,
    "counts an email that failed": counts_failed_emails,
}
for mistake, broken in mistakes.items():
    assert not run_tests(SendRemindersTest, send_reminders=broken).wasSuccessful(), (
        f"SendRemindersTest should fail when send_reminders {mistake}, but all its tests passed"
    )
