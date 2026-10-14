"""Reading Challenge: summarise the pupils' reading logs.

logs maps each pupil's name to a list of pages read per day, day 1 first.
Replace each `raise NotImplementedError` with ONE return statement that uses a
comprehension or a generator expression: no for or while statements.
"""


def totals(logs):
    """A dict from each pupil to their total pages, in the order of logs."""
    raise NotImplementedError


def missed_a_day(logs):
    """The set of pupils with at least one day of 0 pages."""
    raise NotImplementedError


def entries(logs):
    """(name, day, pages) for every day with at least one page; days numbered from 1."""
    raise NotImplementedError


def busiest_day(logs):
    """The most pages anyone read on one day, or 0 when no day was logged."""
    raise NotImplementedError
