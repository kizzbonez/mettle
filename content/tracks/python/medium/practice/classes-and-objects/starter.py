"""Tool Library: the tools a neighbourhood lends to its members.

Every `raise NotImplementedError` marks code you still have to write. Keep the
class name, the method names and their parameters: the tests use them.
"""


class Tool:
    """A tool that members can borrow for a deposit."""

    made = 0

    def __init__(self, name, deposit):
        # YOUR CODE: store name and deposit, start with no borrower and a new
        # empty list of loans, and count this tool in the class attribute made.
        raise NotImplementedError

    def lend(self, person):
        """Lend the tool to person; ValueError if it is already lent."""
        raise NotImplementedError

    def give_back(self):
        """Take the tool back and return who had it; ValueError if it was not lent."""
        raise NotImplementedError

    def is_available(self):
        raise NotImplementedError

    def __repr__(self):
        # For example: Tool('ladder', 35)
        raise NotImplementedError

    def __str__(self):
        # 'NAME: lent to PERSON' or 'NAME: available'
        raise NotImplementedError
