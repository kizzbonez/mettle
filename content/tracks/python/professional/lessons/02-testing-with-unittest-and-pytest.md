---
title: Testing with unittest and pytest
summary: Write automated tests with the standard library's unittest, replace slow or unpredictable collaborators with unittest.mock, keep examples in docstrings honest with doctest, and see what pytest's plain asserts, fixtures and parametrize add.
minutes: 40
objectives:
  - Write unittest test cases with setUp, the assert methods, assertRaises and subTest, and run them
  - Replace a dependency with a Mock or with patch, set return_value and side_effect, and check how it was called
  - Turn docstring examples into tests with doctest
  - Write the same tests in pytest with fixtures and parametrize, and measure coverage
---

## Outline

1. What a test is
2. unittest: test cases and assertions
3. Fixtures and subtests
4. Test doubles with `unittest.mock`
5. doctest
6. What pytest adds
7. Designing tests and measuring coverage

## What a test is

An **automated test** is code that calls your code with known inputs and checks the result, so a
machine can tell you in seconds whether a change broke something. Most tests follow three steps:
**arrange** the inputs, **act** by calling the code, **assert** that the outcome is what you
expect. A **unit test** checks one function or class on its own; an **integration test** checks
several parts working together.

Python ships `unittest` in the standard library. Most projects use **pytest**, a third-party
runner, on top of the same ideas. Learn both: pytest runs unittest tests unchanged.

## unittest: test cases and assertions

Tests are methods whose names start with `test`, inside a subclass of `unittest.TestCase`. The
class gives you assert methods that report both values when they fail:

```python
import unittest


def split_bill(total_cents, people):
    """Split a bill into whole cents; the first shares take the leftover cents."""
    if people < 1:
        raise ValueError("people must be at least 1")
    share, leftover = divmod(total_cents, people)
    return [share + 1 if i < leftover else share for i in range(people)]


class SplitBillTest(unittest.TestCase):
    def setUp(self):
        self.total = 1000

    def test_even_split(self):
        self.assertEqual(split_bill(self.total, 4), [250, 250, 250, 250])

    def test_leftover_goes_to_first_people(self):
        self.assertEqual(split_bill(self.total, 3), [334, 333, 333])

    def test_shares_add_up(self):
        for people in range(1, 8):
            with self.subTest(people=people):
                self.assertEqual(sum(split_bill(self.total, people)), self.total)

    def test_rejects_zero_people(self):
        with self.assertRaises(ValueError) as caught:
            split_bill(self.total, 0)
        self.assertIn("at least 1", str(caught.exception))


if __name__ == "__main__":
    unittest.main(verbosity=2)
```

```text
test_even_split (__main__.SplitBillTest.test_even_split) ... ok
test_leftover_goes_to_first_people (__main__.SplitBillTest.test_leftover_goes_to_first_people) ... ok
test_rejects_zero_people (__main__.SplitBillTest.test_rejects_zero_people) ... ok
test_shares_add_up (__main__.SplitBillTest.test_shares_add_up) ... ok

----------------------------------------------------------------------
Ran 4 tests in 0.001s

OK
```

The common assert methods are `assertEqual`, `assertTrue`/`assertFalse`, `assertIs`,
`assertIsNone`, `assertIn`, `assertIsInstance`, `assertAlmostEqual` for floats and
`assertCountEqual` for "same items, any order". Python 3.14 added `assertStartsWith`,
`assertEndsWith` and `assertHasAttr`. `assertRaises` used with `with` passes only if the block
raises that exception, and keeps it in `caught.exception` for further checks.

In a project the tests live in `tests/test_*.py`, and you run them from the root:

```console
$ python -m unittest discover -s tests        # find and run every tests/test*.py
$ python -m unittest discover -s tests -v     # one line per test
```

## Fixtures and subtests

A **fixture** is the setup a test needs. `setUp` runs before every test method and `tearDown`
after it, even when the test failed. Each test gets a fresh instance of the class, so one test
cannot leak state into the next. `self.addCleanup(function, *args)` registers an undo step at the
moment you create something, which is easier to keep correct than a long `tearDown`.

`subTest` runs the same check over many values and reports each failure separately, with its
parameters, instead of stopping at the first. If `split_bill` forgot the leftover cents and
returned `[share] * people`, three subtests fail, starting with:

```text
FAIL: test_shares_add_up (__main__.SplitBillTest.test_shares_add_up) (people=3)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/tmp/ut1bad.py", line 25, in test_shares_add_up
    self.assertEqual(sum(split_bill(self.total, people)), self.total)
    ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError: 999 != 1000
```

## Test doubles with `unittest.mock`

Code that sends mail, calls a web service or picks at random is hard to test directly. A **test
double** stands in for the real collaborator. `unittest.mock.Mock` creates an object that accepts
any call, records it, and returns what you configure:

- `return_value` sets what a call returns.
- `side_effect` set to an exception makes the call raise it; set to a list, each call returns the
  next item.
- `assert_called_once_with(...)`, `call_count` and `call_args` check how it was used.

`patch` replaces a name for the duration of a test, as a decorator or a `with` block, and puts the
original back afterwards:

```python
import random
import unittest
from unittest.mock import Mock, patch


def pick_winner(entries):
    if not entries:
        raise ValueError("no entries")
    return random.choice(entries).upper()


def notify(sender, address, text):
    try:
        sender.send(address, text)
    except ConnectionError:
        return False
    return True


class PickWinnerTest(unittest.TestCase):
    @patch("random.choice", return_value="bo")
    def test_upper_cases_the_choice(self, fake_choice):
        self.assertEqual(pick_winner(["ada", "bo"]), "BO")
        fake_choice.assert_called_once_with(["ada", "bo"])


class NotifyTest(unittest.TestCase):
    def test_sends_once(self):
        sender = Mock()
        self.assertTrue(notify(sender, "ada@example.com", "You won"))
        sender.send.assert_called_once_with("ada@example.com", "You won")

    def test_reports_a_failed_send(self):
        sender = Mock()
        sender.send.side_effect = ConnectionError("mail server down")
        self.assertFalse(notify(sender, "ada@example.com", "You won"))
        self.assertEqual(sender.send.call_count, 1)


if __name__ == "__main__":
    unittest.main()
```

```text
...
----------------------------------------------------------------------
Ran 3 tests in 0.002s

OK
```

The rule for `patch` is to **patch where the name is looked up**. `pick_winner` looks up `choice`
in the `random` module at call time, so `"random.choice"` is right. Had the module said
`from random import choice`, it would hold its own name `choice`, and you would patch
`"yourmodule.choice"` instead. Passing the collaborator in as an argument, as `notify` does, avoids
patching altogether.

## doctest

A **doctest** is an example in a docstring written as an interactive session. `doctest` runs it
and compares the output, so documentation cannot quietly go out of date:

```python
def initials(full_name):
    """Return the initials of a name, upper case, with a dot after each.

    >>> initials("ada lovelace")
    'A.L.'
    >>> initials("Grace Brewster Hopper")
    'G.B.H'
    >>> initials("")
    Traceback (most recent call last):
        ...
    ValueError: empty name
    """
    words = full_name.split()
    if not words:
        raise ValueError("empty name")
    return "".join(word[0].upper() + "." for word in words)


if __name__ == "__main__":
    import doctest

    print(doctest.testmod())
```

```text
**********************************************************************
File "/tmp/doc2.py", line 6, in __main__.initials
Failed example:
    initials("Grace Brewster Hopper")
Expected:
    'G.B.H'
Got:
    'G.B.H.'
**********************************************************************
1 item had failures:
   1 of   3 in __main__.initials
***Test Failed*** 1 failure.
TestResults(failed=1, attempted=3)
```

The docstring had a typo, and doctest caught it. For an exception, only the `Traceback` line and
the last line are compared. `python -m doctest -v module.py` runs a file's doctests from the shell.
Keep doctests for short, illustrative examples; real test suites belong in test files.

## What pytest adds

pytest (`pip install pytest`, version 9 at the time of writing) finds `test_*.py` files and
`test_` functions, and needs no classes. Its main gifts:

- **Plain `assert`.** pytest rewrites assert statements, so `assert total == 1000` reports both
  sides and the expressions that produced them.
- **Fixtures** are functions marked `@pytest.fixture` that a test requests by naming them as
  parameters. Code after a `yield` inside a fixture is the teardown. Built-ins include `tmp_path`
  (a fresh folder), `monkeypatch` and `capsys` (captured output).
- **`@pytest.mark.parametrize`** runs one test over a table of values, each as its own test.

```python
import pytest

from bills import split_bill


@pytest.fixture
def total():
    return 1000


@pytest.mark.parametrize("people", [1, 2, 3, 7])
def test_shares_add_up(total, people):
    assert sum(split_bill(total, people)) == total


def test_rejects_zero_people(total):
    with pytest.raises(ValueError, match="at least 1"):
        split_bill(total, 0)
```

```console
$ pytest -q
.....                                                                [100%]
5 passed in 0.01s
```

## Designing tests and measuring coverage

Good tests are **fast**, **independent** (any order, no shared state), **deterministic** (no
clock, network or unseeded randomness) and check **behaviour**, not private details, so you can
refactor without rewriting them. Test the boundaries: empty input, one item, the largest allowed
value, and every error you promise to raise.

**Coverage** measures which lines the tests ran. With coverage.py: `coverage run -m pytest`, then
`coverage report -m`, which lists each file's statements, misses, percentage and the missing line
numbers. Add `--branch` to check both sides of every `if`. Uncovered lines are untested for sure;
covered lines are not necessarily tested well, so treat the number as a guide, not a goal.

## Common mistakes

- **A typo that a Mock swallows.** A plain `Mock` accepts any attribute, so `sender.sned(...)`
  passes silently. Build the double from the real class with `create_autospec(Mailer,
  instance=True)`; then the typo raises `AttributeError: Mock object has no attribute 'sned'` and a
  wrong argument count raises `TypeError: missing a required argument: 'text'`.
- **Patching where the name is defined** instead of where it is looked up. The test passes the
  patch to a module nobody calls through, and the real function runs.
- **`assertTrue(a == b)`.** On failure it only says `False is not true`. `assertEqual(a, b)`
  shows both values.
- **Tests that depend on each other's order.** Each test must arrange its own state.

## Practice

1. Write a test that `split_bill(5, 2)` returns `[3, 2]`.
2. A function calls `rates.fetch("EUR")` through a `rates` object passed in. Make a Mock whose
   `fetch` returns `1.08`, and check it was called once with `"EUR"`.
3. Make a Mock whose `fetch` raises `TimeoutError` on the first call and returns `1.08` on the
   second.

### Answers

```python
import unittest
from unittest.mock import Mock


class Answers(unittest.TestCase):
    def test_split_five_two(self):
        self.assertEqual(split_bill(5, 2), [3, 2])

    def test_fetch_called_once(self):
        rates = Mock()
        rates.fetch.return_value = 1.08
        self.assertEqual(rates.fetch("EUR"), 1.08)
        rates.fetch.assert_called_once_with("EUR")

    def test_retry_sequence(self):
        rates = Mock()
        rates.fetch.side_effect = [TimeoutError("slow"), 1.08]
        with self.assertRaises(TimeoutError):
            rates.fetch("EUR")
        self.assertEqual(rates.fetch("EUR"), 1.08)
```

A list given to `side_effect` is consumed one call at a time, and an exception in it is raised
instead of returned, which is how you test retry logic.

## Key takeaways

- `unittest.TestCase` gives assert methods, `setUp`/`tearDown`/`addCleanup` and `subTest`.
- `Mock` records calls; `return_value` and `side_effect` script it; `create_autospec` keeps it honest.
- Patch a name where the code under test looks it up.
- doctest checks the examples in docstrings.
- pytest adds plain `assert`, fixtures and parametrize; coverage shows what the tests never ran.

## Further reading

- [unittest: Unit testing framework](https://docs.python.org/3.15/library/unittest.html)
- [unittest.mock: mock object library](https://docs.python.org/3.15/library/unittest.mock.html)
- [doctest: Test interactive Python examples](https://docs.python.org/3.15/library/doctest.html)
- [pytest: How to use fixtures](https://docs.pytest.org/en/stable/how-to/fixtures.html)
