"""Museum Tickets: adult, child, family and member tickets, and the day's takings.

Every `raise NotImplementedError` marks code you still have to write. Keep the
names: the tests use them and build their own subclasses of your classes.
"""


class Ticket:
    """An adult ticket."""

    BASE = 14.0

    def __init__(self, visitor):
        raise NotImplementedError

    def price(self):
        raise NotImplementedError

    def label(self):
        # 'CLASSNAME VISITOR: PRICE', the price with two decimals.
        raise NotImplementedError


# YOUR CODE: ChildTicket(Ticket), half of super().price().


# YOUR CODE: FamilyTicket(Ticket) with __init__(self, visitor, adults, children).


# YOUR CODE: MemberMixin, with only price(): super().price() less 3.0, never below 0.0.


# YOUR CODE: MemberTicket, with MemberMixin first and Ticket second as bases.


def takings(tickets):
    """The sum of price() of every item, rounded to 2 decimals."""
    raise NotImplementedError
