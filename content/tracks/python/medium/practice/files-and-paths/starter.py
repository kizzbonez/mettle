"""Guest Book: the cottage's guest books, one text file per season.

Every `raise NotImplementedError` marks code you still have to write. Keep the
function names and parameters: the tests call them with str and Path values.
"""

from pathlib import Path


def sign(path, name, message):
    """Add the line 'NAME: MESSAGE' at the end of the file, creating it if needed."""
    raise NotImplementedError


def read_entries(path):
    """(name, message) for every 'NAME: MESSAGE' line; [] if the file does not exist."""
    raise NotImplementedError


def new_book(folder, season):
    """Create FOLDER/SEASON.txt with mode 'x'; True if created, False if it already existed."""
    raise NotImplementedError


def seasons(folder):
    """The sorted names, without .txt, of the .txt files in folder."""
    raise NotImplementedError
