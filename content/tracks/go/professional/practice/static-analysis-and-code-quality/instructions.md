`solution.go` holds the package `darkroom`. It compiles and mostly works, but CI and a reviewer
found problems. Fix every finding below without renaming anything: the tests call
`NewBookings`, `Book`, `IsBooked`, `Taken`, `Member` and `LabAddress`.

**From `go vet ./...`:**

```text
solution.go:32:9: Book passes lock by value: lab.Bookings contains sync.Mutex
solution.go:46:9: IsBooked passes lock by value: lab.Bookings contains sync.Mutex
solution.go:54:9: Taken passes lock by value: lab.Bookings contains sync.Mutex
```

1. Give every method of `Bookings` a pointer receiver. A test books from eight goroutines at
   once, under the race detector.

**From the linter and the reviewer:**

2. *"The error from `time.Parse` is ignored, so `Book("tomorrow", ...)` books the zero time."*
   When the slot does not parse with `slotLayout`, return an error wrapping `ErrBadSlot`, with
   the text `book tomorrow: not a valid slot`.
3. *"`strings.TrimSpace(member)` does nothing: its result is thrown away."* Store the member's
   name without the spaces around it.
4. *"`%v` drops `ErrSlotTaken` from the error chain, so callers' `errors.Is` checks fail."*
   Wrap it with `%w`. The text stays `book 2026-11-03 18:00: slot is already taken`.
5. *"Error strings start with a lower-case letter and have no final punctuation."* The texts
   of the two sentinels become `slot is already taken` and `not a valid slot`.
6. *"`LabAddress` builds `host:port` with `Sprintf`. vet's hostport check flags this pattern
   when it reaches `net.Dial`: an IPv6 host such as `::1` gives `::1:8080`, which no dialer
   accepts."* Use `net.JoinHostPort`, which writes `[::1]:8080`.
7. *"Exported names need doc comments."* Every exported function, method and type gets a doc
   comment that starts with its name followed by a space (`// Book gives ...`).
8. *"`Taken` is the old name of `IsBooked` and duplicates its code."* Keep `Taken` for old
   callers, but make its body the single statement `return b.IsBooked(slot)`, add a paragraph
   to its doc comment starting with `Deprecated: ` and end the comment with the directive
   `//go:fix inline`, so that `go fix` moves callers to `IsBooked`:

   ```go
   // Taken reports whether slot is booked.
   //
   // Deprecated: use [Bookings.IsBooked].
   //
   //go:fix inline
   ```

A test checks findings 7 and 8 the way an analyzer would: it parses `solution.go` with
`go/parser` and inspects the declarations and comments.

```go
b := NewBookings()
b.Book("2026-11-03 18:00", " ada ") // nil
b.IsBooked("2026-11-03 18:00")      // true
b.Member("2026-11-03 18:00")        // "ada"
b.Book("2026-11-03 18:00", "bo")    // "book 2026-11-03 18:00: slot is already taken", wraps ErrSlotTaken
b.Book("next tuesday", "bo")        // "book next tuesday: not a valid slot", wraps ErrBadSlot
LabAddress("::1", 8080)             // "[::1]:8080"
```
