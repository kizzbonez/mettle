Replace the placeholders in `solution.py` with three types. The imports are in the starter.

1. `Size`, a `StrEnum` with the members `SMALL`, `MEDIUM` and `LARGE`, in that order, whose
   values come from `auto()` (so `Size.LARGE == "large"`).
2. `Bike`, a `typing.NamedTuple` with the fields `code: str`, `size: Size` and
   `electric: bool = False`, in that order.
3. `Rental`, a `@dataclass` with the fields `customer: str`, `hours: int = 1` and
   `bikes: list[Bike]`, in that order, where `bikes` defaults to a **new empty list** for each
   rental (use `field(default_factory=...)`).
   - In `__post_init__`, raise `ValueError` if `customer` is empty or only spaces, or if `hours`
     is not between 1 and 24 (both allowed).
   - Add a method `price(self)` that returns the cost in euros: each bike costs 8 per hour, an
     electric one 15 per hour. A rental without bikes costs 0.

Example:

```python
city = Bike("C7", Size.MEDIUM)
zippy = Bike("E2", Size("large"), electric=True)
city.electric, zippy.size                 # (False, <Size.LARGE: 'large'>)
city == ("C7", "medium", False)           # True: a named tuple is a tuple, a StrEnum a str

rental = Rental("Noor", 3, [city, zippy])
rental.price()                            # 69, because (8 + 15) * 3
Rental("Ivo")                             # Rental(customer='Ivo', hours=1, bikes=[])
Rental("Ivo", 25)                         # ValueError
```
