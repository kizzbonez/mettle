"""Museum Tickets: adult, child, family and member tickets, and the day's takings."""


class Ticket:
    """An adult ticket."""

    BASE = 14.0

    def __init__(self, visitor):
        self.visitor = visitor

    def price(self):
        return self.BASE

    def label(self):
        return f"{type(self).__name__} {self.visitor}: {self.price():.2f}"


class ChildTicket(Ticket):
    """Half the price of the ticket it builds on."""

    def price(self):
        return super().price() / 2


class FamilyTicket(Ticket):
    """Adults at full price and children at half price, less 10%."""

    def __init__(self, visitor, adults, children):
        super().__init__(visitor)
        self.adults = adults
        self.children = children

    def price(self):
        full = super().price()
        return round((self.adults * full + self.children * full / 2) * 0.9, 2)


class MemberMixin:
    """Takes 3.0 off the price of whatever ticket it is mixed into."""

    def price(self):
        return max(0.0, super().price() - 3.0)


class MemberTicket(MemberMixin, Ticket):
    pass


def takings(tickets):
    """The sum of price() of every item, rounded to 2 decimals."""
    return round(sum(ticket.price() for ticket in tickets), 2)
