Complete `solution.go`. The types, the sentinel `ErrClosed` and every first line are given: keep
them exactly as they are. Add `"fmt"` and `"strings"` to the imports when you use them.

1. **The two error types.** `(*FieldError).Error()` returns the field, one space and the problem,
   such as `hours must be from 1 to 4`. `(*ClashError).Error()` returns
   `clashes with <With> on <Day> at <Start>:00`, with the hour as two digits (`%02d`), such as
   `clashes with Choir on Tue at 09:00`.
2. **`validate(b Booking) error`** checks three things, in this order, and reports **every**
   problem it finds at once with `errors.Join`. It returns nil when there is none. Each problem is
   a `*FieldError`:
   - the name is empty once spaces are trimmed (`strings.TrimSpace`): field `name`, problem
     `is empty`;
   - `Start` is not from 9 to 21: field `start`, problem `must be from 9 to 21`;
   - `Hours` is not from 1 to 4: field `hours`, problem `must be from 1 to 4`.
3. **`(d *Diary) Add(b Booking) error`** stops at the first rule that fails:
   - if `validate(b)` fails, return its error wrapped as `booking "<Name>": <the error>`;
   - if `b.Day` is `"Sun"`, return `ErrClosed` wrapped as `booking "<Name>" on Sun: hall closed`;
   - if `b` overlaps a booking already in the diary on the same day, return a `*ClashError`
     about that booking, wrapped as `booking "<Name>": clashes with ...`. A booking covers the
     hours from `Start` up to, but not including, `Start + Hours`, so one that ends at 20:00 does
     not clash with one that starts at 20:00;
   - otherwise store `b` in `d.bookings` and return nil. A rejected booking is never stored.

   Wrap with `%w` (use `%q` for the quoted name), so callers can still find what is inside.
4. **`reply(err error) string`** gives the front desk's answer, checking in this order:
   `"booked"` for nil; `"sorry, the hall is closed that day"` when the error is or wraps
   `ErrClosed`; `"taken by <With> from <Start>:00"` (two-digit hour) when it holds a
   `*ClashError`; `"please check the <Field>"` for the first `*FieldError` it holds; and
   `"something went wrong"` for anything else. Use `errors.Is` and `errors.AsType`, so that
   `reply` also works when another layer has wrapped the error again.

```go
var d Diary
d.Add(Booking{Name: "Choir", Day: "Tue", Start: 18, Hours: 2}) // nil
d.Add(Booking{Name: "Yoga", Day: "Tue", Start: 20, Hours: 1})  // nil: starts as the choir ends

err := d.Add(Booking{Name: "Chess", Day: "Tue", Start: 19, Hours: 2})
err.Error() // `booking "Chess": clashes with Choir on Tue at 18:00`
reply(err)  // "taken by Choir from 18:00"

err = d.Add(Booking{Name: " ", Day: "Wed", Start: 8, Hours: 2})
err.Error() // "booking \" \": name is empty\nstart must be from 9 to 21"
reply(err)  // "please check the name"

reply(d.Add(Booking{Name: "Quiz", Day: "Sun", Start: 19, Hours: 3})) // "sorry, the hall is closed that day"
```
