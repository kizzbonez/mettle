This time you write the tests, not the code. `solution.py` starts with two working functions,
`late_fee` and `send_reminders`; read their docstrings and do not change them. Below them are two
`unittest.TestCase` classes with one test each. Add test methods so that the classes check every
rule listed here.

**How it is judged.** The lab runs your two classes with `unittest`, first against correct
versions of the functions, where every test must pass, and then against broken versions, each
with one of the mistakes below, where at least one of your tests must fail. (It swaps the
functions in the module, so call them by their plain names, `late_fee(...)`, as the starter does.)

1. `LateFeeTest` checks `late_fee(days_late, per_day=25, cap=500)`:
   - a book returned on time (`0` days) costs `0`;
   - a few days late costs days times 25, such as `75` for 3 days;
   - the fee stops at the cap: `500` for 20 days and for more (`subTest` suits a list of
     cases);
   - the `per_day` and `cap` you pass are used, such as `late_fee(2, per_day=10, cap=30)` and
     `late_fee(4, per_day=10, cap=30)`;
   - a negative `days_late` raises `ValueError` (`assertRaises`).
2. `SendRemindersTest` checks `send_reminders(loans, mailer)` with a `Mock` as the mailer:
   - only overdue loans get an email: give it loans with `days_late` of `0` and below as well,
     and check that `send` was called with exactly the right address and text,
     `"TITLE is N days late"` (`assert_called_once_with`);
   - the number it returns is the number of emails sent (`call_count` helps);
   - when `send` raises `ConnectionError` for one loan, nothing escapes, that loan is not counted,
     and the next overdue loan is still emailed. A list given to `side_effect`, such as
     `[ConnectionError("mail server down"), None]`, makes the first call raise and the second
     return.

**Example.** If someone deleted the cap and `late_fee` returned `days_late * per_day`, a test
like this one fails, because `late_fee(35)` would be `875`:

```python
def test_fee_stops_at_the_cap(self):
    for days in [20, 21, 35]:
        with self.subTest(days=days):
            self.assertEqual(late_fee(days), 500)
```

The visible check runs your classes against the correct functions, against a `late_fee` without
the cap, and against a `send_reminders` that emails every loan, overdue or not. The hidden checks
use other broken versions, one for each rule above.
