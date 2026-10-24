Complete `solution.go`, adding `"fmt"` to the imports. The booker knows nothing about the real
diary app or text service: it depends only on two small interfaces that it declares itself, and
the tests pass in fakes of their own.

1. **The interfaces.** Give `Diary` exactly these two methods, and `Notifier` exactly this one,
   and nothing more (the tests' fakes have only these):

   ```go
   type Diary interface {
   	Booked(day time.Time) (int, error)        // how many tunings the day already has
   	Add(day time.Time, customer string) error // writes one tuning in
   }

   type Notifier interface {
   	Notify(customer, message string) error
   }
   ```
2. **`NotifyFunc`**: give it a method `Notify(customer, message string) error` that calls the
   function itself, so that any function of that shape is a `Notifier`, as `http.HandlerFunc`
   is an `http.Handler`.
3. **`NewBooker(diary Diary, notifier Notifier, opts ...Option) *Booker`** returns a `Booker`
   with a daily limit of 3 and the sign-off `"Ivy"`, then applies each option in order. Give
   `Booker` the fields that needs.
4. **`WithDailyLimit(n int) Option`** sets the limit, but ignores an `n` below 1.
   **`WithSignOff(s string) Option`** sets the sign-off. When two options set the same thing,
   the later one wins.
5. **`(b *Booker) Book(customer string, day time.Time) error`**, in this order:
   - ask the diary how many tunings `day` has; on an error, return
     `fmt.Errorf("reading the diary: %w", err)`;
   - if the day already has `limit` or more, return
     `fmt.Errorf("%s: %w", day.Format("Mon 2 Jan"), ErrFull)` and write nothing;
   - `Add` the tuning; on an error, return `fmt.Errorf("writing the diary: %w", err)`;
   - notify the customer with the message
     `fmt.Sprintf("Your piano tuning is booked for %s. %s", day.Format("Mon 2 Jan"), signOff)`;
     on an error, the booking stands, and you return
     `fmt.Errorf("booked, but could not tell %s: %w", customer, err)`;
   - otherwise return `nil`.

The tests declare their own fakes, whose names start with `test`; give your own declarations
other names.

Example, with a diary that starts empty:

```go
texts := NotifyFunc(func(customer, message string) error {
	fmt.Println(customer+":", message)
	return nil
})
friday := time.Date(2026, time.November, 6, 0, 0, 0, 0, time.UTC)

b := NewBooker(diary, texts, WithDailyLimit(2), WithSignOff("Ivy, the valley piano tuner"))
b.Book("Mrs Okafor", friday) // prints "Mrs Okafor: Your piano tuning is booked for Fri 6 Nov. Ivy, the valley piano tuner"; nil
b.Book("Mr Lee", friday)     // prints the same for Mr Lee; nil
b.Book("Dr Haas", friday)    // prints nothing; error "Fri 6 Nov: that day is fully booked", which is ErrFull
```
