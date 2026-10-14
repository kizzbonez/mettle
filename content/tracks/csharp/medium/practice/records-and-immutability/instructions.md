`Booking` and `Party` are positional records already. `Seat` is still an ordinary class. Write the
parts marked with `TODO` and `throw new NotImplementedException();`.

1. **`Seat`**: replace the class with a positional `readonly record struct` that has the same two
   properties, `Row` (a `char`) and `Number`. One line is enough. Two seats with the same row and
   number are then equal, with `==` too, and a seat prints as `Seat { Row = C, Number = 7 }`.
2. **`Booking.Ticket`** is a computed property: the name, the row and number written together,
   and the price with two decimals, separated by `, `. A paid booking ends with `, paid`. Write
   it with `=>`, so that a copy made with `with` computes its own ticket.
3. **`Booking.Pay()`** returns a copy that is paid. **`Booking.MoveTo(Seat seat)`** returns a copy
   at the new seat. Everything else is kept, `Paid` included. Make both copies with `with`; the
   booking they are called on never changes.
4. **`Party.Add(Booking booking)`** returns a new party with the booking added at the end of
   `Bookings`. Records are only shallowly immutable: the original party and **its list** must not
   change, so the new party needs a list of its own.

Example:

```csharp
var seat = new Seat('C', 7);
seat == new Seat('C', 7)            // true: a record compares its values
seat.ToString()                     // "Seat { Row = C, Number = 7 }"

var booking = new Booking("Ada", seat, 42.50m);
booking.Ticket                      // "Ada, C7, 42.50"
var paid = booking.Pay();
paid.Ticket                         // "Ada, C7, 42.50, paid"
var moved = paid.MoveTo(new Seat('D', 2));
moved.Ticket                        // "Ada, D2, 42.50, paid"
booking.Paid                        // false: the original never changes

var party = new Party("Bo", [booking]);
var bigger = party.Add(new Booking("Cy", new Seat('C', 8), 42.50m));
bigger.Bookings.Count               // 2
party.Bookings.Count                // 1: the original party still has one
```
