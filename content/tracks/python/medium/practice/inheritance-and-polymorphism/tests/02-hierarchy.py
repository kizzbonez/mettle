assert ChildTicket.__bases__ == (Ticket,) and FamilyTicket.__bases__ == (Ticket,), "ChildTicket and FamilyTicket are subclasses of Ticket"
assert MemberMixin.__bases__ == (object,), "MemberMixin has no base class but object"
assert "__init__" not in vars(MemberMixin), "MemberMixin has no __init__"
assert [cls.__name__ for cls in MemberTicket.__mro__] == ["MemberTicket", "MemberMixin", "Ticket", "object"], (
    "MemberTicket has MemberMixin first and Ticket second as bases"
)
assert isinstance(MemberTicket("x"), Ticket) and not issubclass(Ticket, MemberMixin), "a member ticket is a Ticket"

anna = Ticket("Anna")
assert anna.visitor == "Anna", "Ticket stores the visitor"
assert anna.label() == "Ticket Anna: 14.00", "label of an adult ticket"


class GalaTicket(Ticket):
    BASE = 30.0


class GalaChild(ChildTicket):
    BASE = 30.0


assert GalaTicket("Mo").price() == 30.0, "Ticket.price reads BASE through self, so a subclass can change it"
assert GalaChild("Mo").price() == 15.0, "ChildTicket halves the price of the ticket it builds on"
assert GalaChild("Mo").label() == "GalaChild Mo: 15.00", "label names the object's own class"


class WeekendTicket(Ticket):
    def price(self):
        return super().price() + 2.0


class WeekendChild(ChildTicket, WeekendTicket):
    pass


assert WeekendChild("Ivy").price() == 8.0, "ChildTicket.price halves what super().price() returns, the next class in the MRO"
assert WeekendChild("Ivy").label() == "WeekendChild Ivy: 8.00", "label uses the price of the object's own class"
