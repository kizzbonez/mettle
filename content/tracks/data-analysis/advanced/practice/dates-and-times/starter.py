"""Radio Schedule: the community station's show log, on every listener's clock.

Every `raise NotImplementedError` marks code you still have to write. Use pd.to_datetime,
the .dt accessor, tz_localize and tz_convert, and date_range: never add hours by hand.
"""

import pandas as pd


def parse_log(text):
    """Times written DD/MM/YYYY HH:MM as datetimes; anything else becomes NaT."""
    raise NotImplementedError


def show_table(shows):
    """The day name of each show's start and the real minutes from start to end."""
    # start and end are naive London clock times: say which zone they are in first.
    raise NotImplementedError


def listener_times(starts, zone):
    """London clock times as the same moments on the clock of zone."""
    raise NotImplementedError


def weekly_slots(first, count):
    """count dates a week apart from first, at the same London clock time."""
    raise NotImplementedError
