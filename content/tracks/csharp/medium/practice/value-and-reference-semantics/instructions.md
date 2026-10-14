`Plate` is a class and `ParkingTicket` a `readonly struct`. Their constructors are complete, and
`ParkingTicket` is finished: do not change it. Write the bodies marked with
`throw new NotImplementedException();`.

1. **Equality for `Plate`.** Two plates are the same car when their codes match once case and
   spaces are ignored: `AB12 CDE`, `ab12cde` and `AB 12 CDE` are one car. `Code` keeps the text
   exactly as it was typed.
   - Override `Equals(object? obj)`. It is `false` for `null` and for anything that is not a
     `Plate`.
   - Override `GetHashCode()` so that it agrees with `Equals`: equal plates must give equal hash
     codes, or a `HashSet<Plate>` will not find them.
   - Do not add an `==` operator. `==` on two plates keeps comparing references.
2. **`CarPark`** keeps the cars inside in a `HashSet<Plate>`, which relies on your equality.
   - `bool Enter(Plate plate)` lets the car in and returns `true`, or returns `false` and changes
     nothing if that car is already inside.
   - `bool Leave(Plate plate)` lets the car out and returns `true`, or returns `false` if it was
     not inside.
   - `int Count` is the number of cars inside.
3. **`CarPark.Extend(ref ParkingTicket ticket, int minutes)`** adds minutes to a ticket. A
   `ParkingTicket` cannot be changed, so replace the caller's ticket with a new one that has the
   same `Plate` and more `Minutes`. If `minutes` is not positive, throw
   `ArgumentOutOfRangeException` and leave the ticket as it was.

Example:

```csharp
var a = new Plate("AB12 CDE");
var b = new Plate("ab12cde");
a.Equals(b)                           // true: the same car
a == b                                // false: two different objects
a.GetHashCode() == b.GetHashCode()    // true

var park = new CarPark();
park.Enter(a)                         // true
park.Enter(b)                         // false: that car is already inside
park.Count                            // 1
park.Leave(new Plate("AB 12 CDE"))    // true
park.Count                            // 0

var ticket = new ParkingTicket(a, 60);
var copy = ticket;                    // a copy of the whole value
CarPark.Extend(ref ticket, 30);
ticket.Minutes                        // 90
copy.Minutes                          // 60
```
