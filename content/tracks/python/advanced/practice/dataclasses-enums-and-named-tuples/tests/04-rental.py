# Rental: fields and defaults, a fresh list per rental, validation and price.
import dataclasses

assert dataclasses.is_dataclass(Rental), "Rental should be a dataclass"
names = [f.name for f in dataclasses.fields(Rental)]
assert names == ["customer", "hours", "bikes"], "Rental has the fields customer, hours and bikes, in that order"

first, second = Rental("Ana"), Rental("Bo")
assert first.hours == 1 and first.bikes == [], "hours defaults to 1 and bikes to an empty list"
first.bikes.append(Bike("C1", Size.SMALL))
assert second.bikes == [] and Rental("Cy").bikes == [], "each rental gets its own new list of bikes"
assert Rental("Ana", 2) == Rental("Ana", 2, []), "rentals with equal fields are equal"
assert Rental(customer="Ana", hours=4, bikes=[]).hours == 4, "fields can be given by keyword"

for hours in (1, 24):
    assert Rental("Dee", hours).hours == hours, "1 and 24 hours are both allowed"
for hours in (0, 25, -3):
    try:
        Rental("Dee", hours)
    except ValueError:
        pass
    else:
        raise AssertionError("hours outside 1 to 24 should raise ValueError")
for customer in ("", "   "):
    try:
        Rental(customer, 2)
    except ValueError:
        pass
    else:
        raise AssertionError("an empty or blank customer name should raise ValueError")
assert Rental(" Zoë ").customer == " Zoë ", "a valid customer name is kept as given"

plain = Bike("C1", Size.SMALL)
motor = Bike("E1", Size.MEDIUM, electric=True)
assert Rental("Eli").price() == 0, "a rental without bikes costs 0"
assert Rental("Eli", 1, [plain]).price() == 8, "one plain bike for one hour costs 8"
assert Rental("Eli", 1, [motor]).price() == 15, "one electric bike for one hour costs 15"
assert Rental("Eli", 24, [plain, plain, motor]).price() == (8 + 8 + 15) * 24, "every bike is charged for every hour"
group = Rental("Eli", 2)
group.bikes.extend([motor, motor])
assert group.price() == 60, "price uses the bikes in the list when it is called"
