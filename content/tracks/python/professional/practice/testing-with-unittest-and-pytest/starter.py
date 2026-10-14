"""Late fees and reminders for the village library, and the tests that protect them."""
import unittest
from unittest.mock import Mock


def late_fee(days_late, per_day=25, cap=500):
    """Return the fee in cents for a book returned DAYS_LATE days late.

    Each late day costs PER_DAY cents, but the fee never goes above CAP.
    Raise ValueError when DAYS_LATE is negative.
    """
    if days_late < 0:
        raise ValueError("days_late cannot be negative")
    return min(days_late * per_day, cap)


def send_reminders(loans, mailer):
    """Email every borrower whose loan is overdue, and return how many emails went out.

    LOANS is a list of dicts with the keys "email", "title" and "days_late". MAILER has a method
    send(address, text). A loan is overdue when days_late is above 0. When send raises
    ConnectionError, that loan is skipped and the others are still emailed.
    """
    sent = 0
    for loan in loans:
        if loan["days_late"] <= 0:
            continue
        text = f"{loan['title']} is {loan['days_late']} days late"
        try:
            mailer.send(loan["email"], text)
        except ConnectionError:
            continue
        sent += 1
    return sent


# Do not change the two functions above: write tests for them below.


class LateFeeTest(unittest.TestCase):
    def test_three_days_late(self):
        self.assertEqual(late_fee(3), 75)

    # YOUR CODE: more test methods: on time, the cap, your own per_day and cap,
    # and a negative number of days.


class SendRemindersTest(unittest.TestCase):
    def test_one_overdue_loan(self):
        mailer = Mock()
        loans = [{"email": "ada@example.com", "title": "Dune", "days_late": 2}]
        self.assertEqual(send_reminders(loans, mailer), 1)
        mailer.send.assert_called_once_with("ada@example.com", "Dune is 2 days late")

    # YOUR CODE: more test methods: loans that are not overdue, the returned count,
    # and a send that raises ConnectionError (side_effect).


if __name__ == "__main__":
    unittest.main(verbosity=2)
