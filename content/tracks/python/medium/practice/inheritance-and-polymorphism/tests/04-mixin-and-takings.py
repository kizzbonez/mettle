assert MemberTicket("Ines").price() == 11.0, "a member's adult ticket costs 3.0 less"


class MemberChild(MemberMixin, ChildTicket):
    pass


class MemberFamily(MemberMixin, FamilyTicket):
    pass


class CheapTicket(Ticket):
    BASE = 2.0


class MemberCheap(MemberMixin, CheapTicket):
    pass


assert MemberChild("Leo").price() == 4.0, "the mixin takes 3.0 off a child ticket's price"
member_family = MemberFamily("Okafor", 2, 3)
assert member_family.visitor == "Okafor" and member_family.adults == 2, "the mixin leaves __init__ to the ticket class"
assert round(member_family.price(), 2) == 41.1, "the mixin takes 3.0 off a family ticket's price"
assert MemberCheap("Pip").price() == 0.0, "the member discount never makes a price negative"
assert MemberChild("Leo").label() == "MemberChild Leo: 4.00", "label of a combined class shows its own name and price"


class GiftVoucher:
    def __init__(self, amount):
        self.amount = amount

    def price(self):
        return self.amount


assert takings([]) == 0, "takings of an empty list is 0"
assert takings([GiftVoucher(25.0)]) == 25.0, "takings works with any object that has price()"
day = [Ticket("A"), ChildTicket("B"), FamilyTicket("C", 2, 2), MemberTicket("D"), GiftVoucher(10.55)]
assert takings(day) == 80.35, "takings adds the price of every item, of every class"
assert takings([GiftVoucher(0.1), GiftVoucher(0.2)]) == 0.3, "takings rounds the total to two decimals"
