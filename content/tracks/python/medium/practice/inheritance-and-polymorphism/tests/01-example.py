assert Ticket("Ana").price() == 14.0, "Ticket('Ana').price(), as in the example"
assert ChildTicket("Ben").label() == "ChildTicket Ben: 7.00", "ChildTicket('Ben').label(), as in the example"
assert FamilyTicket("Okafor", 2, 3).price() == 44.1, "FamilyTicket('Okafor', 2, 3).price(), as in the example"
assert MemberTicket("Ines").label() == "MemberTicket Ines: 11.00", "MemberTicket('Ines').label(), as in the example"


class MemberChildTicket(MemberMixin, ChildTicket):
    pass


assert MemberChildTicket("Leo").price() == 4.0, "MemberChildTicket('Leo').price(), as in the example"
assert takings([Ticket("Ana"), ChildTicket("Ben"), MemberChildTicket("Leo")]) == 25.0, "takings for the example tickets"
