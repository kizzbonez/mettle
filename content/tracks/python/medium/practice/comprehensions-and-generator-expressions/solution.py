"""Reading Challenge: summarise the pupils' reading logs."""


def totals(logs):
    """A dict from each pupil to their total pages, in the order of logs."""
    return {name: sum(pages) for name, pages in logs.items()}


def missed_a_day(logs):
    """The set of pupils with at least one day of 0 pages."""
    return {name for name, pages in logs.items() if any(count == 0 for count in pages)}


def entries(logs):
    """(name, day, pages) for every day with at least one page; days numbered from 1."""
    return [
        (name, day, count)
        for name, pages in logs.items()
        for day, count in enumerate(pages, start=1)
        if count > 0
    ]


def busiest_day(logs):
    """The most pages anyone read on one day, or 0 when no day was logged."""
    return max((count for pages in logs.values() for count in pages), default=0)
