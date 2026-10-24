`solution.go` was cut out of the attendants' till program, so it still says `package main` and
everything in it is visible to everyone. Turn it into the library package `deckchair` that the
till and the end-of-day report will import. The tests are compiled into whatever package your
file declares, and they also read `solution.go` itself to check its names and comments.

1. **Package clause.** Change `package main` to `package deckchair`, and put a package doc
   comment directly above it: a sentence that starts with `Package deckchair`.
2. **No `init`.** Delete the `init` function and give `rates` its value in its own declaration
   instead (`var rates = map[string]int{...}`, with the same three rates).
3. **Private takings.** Other packages may read a shift's takings but never change them. Rename
   the field `Takings` of `Shift` to `takings`, keeping its type `int`. `Attendant` stays
   exported.
4. **`Price(kind string, hours int) (int, bool)`** returns the price in pence of hiring one item
   of `kind` for `hours` hours: the hourly rate from `rates` times the hours, but never more
   than `DayCapHours` hours are charged (use the helper `billable`). For a kind that is not in
   `rates`, or for fewer than one hour, it returns `0, false`.
5. **`Sell(s *Shift, kind string, hours int) (int, bool)`** prices the hire with `Price`, adds
   the price to the shift's takings when `Price` reports `true`, and returns what `Price`
   returned. **`Takings(s Shift) int`** returns the takings.
6. **Doc comments.** Give each exported name, `DayCapHours`, `Shift`, `Price`, `Sell` and
   `Takings`, a doc comment directly above it that is a sentence starting with the name (replace
   the `// Task` notes). Export nothing else: `rates` and `billable` stay unexported, and any
   helper you add starts with a lower-case letter.

Example:

```go
Price("deckchair", 2)   // 500, true
Price("sunlounger", 7)  // 2000, true: charged for 5 hours, not 7
Price("hammock", 2)     // 0, false: not something the stand hires out
Price("windbreak", 0)   // 0, false

s := &Shift{Attendant: "Mo"}
Sell(s, "deckchair", 3) // 750, true
Sell(s, "windbreak", 1) // 150, true
Sell(s, "hammock", 1)   // 0, false: the takings stay as they were
Takings(*s)             // 900
```

When you are done, this is what `go doc` shows the till program's authors (with your own
package sentence), and it is all they can use:

```text
package deckchair // import "example.com/promenade/deckchair"

Package deckchair prices the hire of beach furniture on the promenade and keeps
each attendant's takings for the day.

const DayCapHours = 5
func Price(kind string, hours int) (int, bool)
func Sell(s *Shift, kind string, hours int) (int, bool)
func Takings(s Shift) int
type Shift struct{ ... }
```
