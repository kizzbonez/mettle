"""Room Desk: answer the hotel receptionist's questions by room code."""

import pandas as pd


def index_by_room(rooms):
    """The rooms table with the room code as its index."""
    return rooms.set_index("room")


def rate_of(indexed, room):
    """The nightly rate of one room, looked up by its code."""
    return indexed.at[room, "rate"]


def block(indexed, first, last, columns):
    """Rooms first to last, both included, with only the listed columns."""
    return indexed.loc[first:last, columns]


def last_rooms(indexed, n):
    """The last n rows by position, with room as a column again and rows numbered from 0."""
    return indexed.iloc[len(indexed) - n :].reset_index()
