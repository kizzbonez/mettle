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

    def test_on_time_is_free(self):
        self.assertEqual(late_fee(0), 0)

    def test_fee_stops_at_the_cap(self):
        for days, fee in [(19, 475), (20, 500), (21, 500), (35, 500)]:
            with self.subTest(days=days):
                self.assertEqual(late_fee(days), fee)

    def test_own_rate_and_cap(self):
        self.assertEqual(late_fee(2, per_day=10, cap=30), 20)
        self.assertEqual(late_fee(4, per_day=10, cap=30), 30)

    def test_negative_days_are_rejected(self):
        with self.assertRaises(ValueError):
            late_fee(-1)


class SendRemindersTest(unittest.TestCase):
    def setUp(self):
        self.mailer = Mock()
        self.dune = {"email": "ada@example.com", "title": "Dune", "days_late": 2}
        self.emma = {"email": "bo@example.com", "title": "Emma", "days_late": 0}
        self.ulysses = {"email": "cy@example.com", "title": "Ulysses", "days_late": 11}
        self.beloved = {"email": "di@example.com", "title": "Beloved", "days_late": -3}

    def test_one_overdue_loan(self):
        mailer = Mock()
        loans = [{"email": "ada@example.com", "title": "Dune", "days_late": 2}]
        self.assertEqual(send_reminders(loans, mailer), 1)
        mailer.send.assert_called_once_with("ada@example.com", "Dune is 2 days late")

    def test_loans_not_overdue_get_no_email(self):
        sent = send_reminders([self.emma, self.ulysses, self.beloved], self.mailer)
        self.assertEqual(sent, 1)
        self.mailer.send.assert_called_once_with("cy@example.com", "Ulysses is 11 days late")

    def test_counts_every_email(self):
        self.assertEqual(send_reminders([self.dune, self.emma, self.ulysses], self.mailer), 2)
        self.assertEqual(self.mailer.send.call_count, 2)
        self.assertEqual(send_reminders([], Mock()), 0)

    def test_failed_send_is_skipped(self):
        self.mailer.send.side_effect = [ConnectionError("mail server down"), None]
        sent = send_reminders([self.dune, self.ulysses], self.mailer)
        self.assertEqual(sent, 1)
        self.assertEqual(self.mailer.send.call_count, 2)


if __name__ == "__main__":
    unittest.main(verbosity=2)
