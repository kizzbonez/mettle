`solution.go` already defines two struct types: a `Booking` (who, how many courts, for how many
hours, and whether it is paid) and a `Tally` (how many unpaid bookings a person has, and what they
owe in cents). Do not change them. Complete the four functions.

1. **`newBooking(name string, courts int) Booking`** is a constructor. It returns a booking for
   `name` with the spaces around it removed, `courts` courts but never fewer than 1, `Hours` set
   to 1, and not paid.
2. **`cost(b Booking) int`** returns the price in cents: each court costs 1500 for the first hour
   and 800 for every hour after that. `Hours` is always at least 1.
3. **`payAll(bookings []Booking, name string) int`** marks every unpaid booking for `name` as paid,
   **in the slice itself**, and returns how many bookings it changed. Names match without regard to
   case (`strings.EqualFold`), so `"ada"` pays Ada's bookings. Bookings that were already paid are
   not counted.
4. **`owed(bookings []Booking) map[string]Tally`** returns, for every person with at least one
   unpaid booking, a `Tally` of their unpaid bookings and the total `cost` of them. The key is the
   name in lower case, so `"Ada"` and `"ADA"` share one tally. Paid bookings are left out.

```go
day := []Booking{
	newBooking(" Ada ", 2), // {Name:Ada Courts:2 Hours:1 Paid:false}
	{Name: "Bo", Courts: 1, Hours: 3},
	{Name: "ada", Courts: 1, Hours: 2, Paid: true},
}
cost(day[0])       // 3000: 2 courts x 1500
cost(day[1])       // 3100: 1500 + 800 + 800
owed(day)          // map[ada:{Bookings:1 Cents:3000} bo:{Bookings:1 Cents:3100}]
payAll(day, "ADA") // 1: day[0] is now paid; day[2] already was
owed(day)          // map[bo:{Bookings:1 Cents:3100}]
```
