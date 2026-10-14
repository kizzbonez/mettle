# The rental example from the instructions.
city = Bike("C7", Size.MEDIUM)
zippy = Bike("E2", Size("large"), electric=True)

assert city.electric is False, "electric defaults to False"
assert zippy.size is Size.LARGE, "Size('large') looks the member up by value"
assert city == ("C7", "medium", False), "a Bike equals a plain tuple with the same items"

rental = Rental("Noor", 3, [city, zippy])
assert rental.price() == 69, "a rental of one plain and one electric bike for 3 hours costs (8 + 15) * 3"
assert repr(Rental("Ivo")) == "Rental(customer='Ivo', hours=1, bikes=[])", "the dataclass repr shows the defaults"

try:
    Rental("Ivo", 25)
except ValueError:
    pass
else:
    raise AssertionError("a rental of 25 hours should raise ValueError")
