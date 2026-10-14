Write the exception classes and the two functions of `solution.py`. A seat is written as a row
number from 1 to 30 followed by a letter from A to F, such as `14C`.

1. **Exceptions.** `BookingError(Exception)` is the base class of the module. Two subclasses:
   - `BadSeatError(text)` inherits from **both** `BookingError` and `ValueError`, stores `text`
     as an attribute, and its message is `not a seat: TEXT` with the text shown by its `repr`:
     `not a seat: 'Z9'`.
   - `SeatTakenError(seat)` inherits from `BookingError`, stores `seat` as an attribute, and its
     message is `seat SEAT is taken`: `seat 1A is taken`.

   Pass the message to `super().__init__`, so it is also the only item of `args`.
2. **`parse_seat(text)`** strips the text and upper-cases it. The last character is the letter
   and everything before it is the row, converted with `int()`. It returns the seat in its
   normal form, `f"{row}{letter}"`, so `" 07c "` gives `"7C"`. It raises `BadSeatError(text)`,
   with the text exactly as given, when:
   - `int()` fails on the row: raise it **from** that ValueError, so the cause is kept;
   - the row is not from 1 to 30, or the letter is not one of `ABCDEF`.
3. **`book(requests, taken)`** books a basket. `requests` is a list of seat texts and `taken` a
   set of seats already sold, in normal form. Number the requests from 1 and check each one:
   parse it, and if its seat is in `taken` or earlier in this same basket, it is a
   `SeatTakenError(seat)`. For every `BookingError`, add the note `request N: TEXT` (the text
   by its `repr`) with `add_note`, and keep going. Then:
   - if there were errors, raise `ExceptionGroup("booking failed", errors)` with the errors in
     request order, and leave `taken` unchanged;
   - otherwise add the seats to `taken` and return the list of seats in normal form, in order.

Example:

```python
taken = {"1A", "1B"}
parse_seat(" 14c ")                    # '14C'
parse_seat("40C")                      # raises BadSeatError: not a seat: '40C'
book(["3A", "3b"], taken)              # ['3A', '3B'], and taken now has four seats
try:
    book(["2C", "1A", "Z9", "2c"], taken)
except* SeatTakenError as group:
    print([error.seat for error in group.exceptions])        # ['1A', '2C']
    print([error.__notes__ for error in group.exceptions])   # [["request 2: '1A'"], ["request 4: '2c'"]]
except* BadSeatError as group:
    print([str(error) for error in group.exceptions])        # ["not a seat: 'Z9'"]
# taken is still {'1A', '1B', '3A', '3B'}: nothing from the failed basket was booked
```

**Tip.** Collect the good seats in a list while you check, and add them to `taken` only at the
end, once you know there were no errors.
