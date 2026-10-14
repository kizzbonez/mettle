# SendRemindersTest must check who is emailed, the exact arguments and the returned count.
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


def emails_on_the_due_day(loans, mailer):
    sent = 0
    for loan in loans:
        if loan["days_late"] < 0:
            continue
        try:
            mailer.send(loan["email"], f"{loan['title']} is {loan['days_late']} days late")
        except ConnectionError:
            continue
        sent += 1
    return sent


def different_text(loans, mailer):
    sent = 0
    for loan in loans:
        if loan["days_late"] <= 0:
            continue
        try:
            mailer.send(loan["email"], f"{loan['title']} is overdue by {loan['days_late']} days")
        except ConnectionError:
            continue
        sent += 1
    return sent


def swapped_arguments(loans, mailer):
    sent = 0
    for loan in loans:
        if loan["days_late"] <= 0:
            continue
        try:
            mailer.send(f"{loan['title']} is {loan['days_late']} days late", loan["email"])
        except ConnectionError:
            continue
        sent += 1
    return sent


def counts_every_loan(loans, mailer):
    for loan in loans:
        if loan["days_late"] <= 0:
            continue
        try:
            mailer.send(loan["email"], f"{loan['title']} is {loan['days_late']} days late")
        except ConnectionError:
            continue
    return len(loans)


mistakes = {
    "also emails loans that are due today (days_late 0)": emails_on_the_due_day,
    "sends a different text": different_text,
    "passes the text and the address the wrong way round": swapped_arguments,
    "returns the number of loans instead of the number of emails sent": counts_every_loan,
}
for mistake, broken in mistakes.items():
    assert not run_tests(SendRemindersTest, send_reminders=broken).wasSuccessful(), (
        f"SendRemindersTest should fail when send_reminders {mistake}, but all its tests passed"
    )
