"""Robot Vacuum: read the app's commands and the robot's messages with match.

Every `raise NotImplementedError` marks code you still have to write. Keep the
class Bump as it is, and the function names: the tests use them.
"""


class Bump:
    """The bump sensor hit something at the point (x, y)."""

    __match_args__ = ("x", "y")

    def __init__(self, x, y):
        self.x = x
        self.y = y


def parse(command):
    """('forward', N), ('back', N), ('turn', SIDE), ('clean', ROOMS) or ('dock',)."""
    # YOUR CODE: match command.lower().split() against the command shapes.
    raise NotImplementedError


def report(message):
    """The text for a battery, stuck, bin or Bump message, or 'not a message'."""
    # YOUR CODE: match message against dict patterns and Bump patterns.
    raise NotImplementedError
