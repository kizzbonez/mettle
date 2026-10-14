family = FamilyTicket("Nakamura", 2, 2)
assert family.visitor == "Nakamura", "FamilyTicket calls super().__init__, so the visitor is stored"
assert (family.adults, family.children) == (2, 2), "FamilyTicket stores adults and children"
assert family.price() == 37.8, "two adults and two children, less 10%"
assert family.label() == "FamilyTicket Nakamura: 37.80", "label of a family ticket"
assert FamilyTicket("Solo", 1, 0).price() == 12.6, "a family of one adult still gets 10% off"
assert FamilyTicket("Kids", 0, 4).price() == 25.2, "children pay half the full price"
assert FamilyTicket("Big", 3, 5).price() == round((3 * 14.0 + 5 * 7.0) * 0.9, 2), "the price is rounded to two decimals"
assert isinstance(family, Ticket), "a family ticket is a Ticket"


class GalaFamily(FamilyTicket):
    BASE = 20.0


assert GalaFamily("Lee", 1, 2).price() == 36.0, "FamilyTicket takes the full price from super().price()"
