"""Room Desk: answer the hotel receptionist's questions by room code.

Every `raise NotImplementedError` marks code you still have to write.
Keep the function names and parameters: the tests call them.
"""

import pandas as pd


def index_by_room(rooms):
    """The rooms table with the room code as its index."""
    raise NotImplementedError


def rate_of(indexed, room):
    """The nightly rate of one room, looked up by its code."""
    raise NotImplementedError


def block(indexed, first, last, columns):
    """Rooms first to last, both included, with only the listed columns."""
    # Labels, not positions.
    raise NotImplementedError


def last_rooms(indexed, n):
    """The last n rows by position, with room as a column again and rows numbered from 0."""
    # Positions this time. n may be 0.
    raise NotImplementedError
