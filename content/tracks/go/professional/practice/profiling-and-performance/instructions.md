The four functions in the starter give the right answers but waste work. Rewrite each one so
that it returns **exactly** what it returns now and stays within its budget. The tests measure
the budgets with `testing.AllocsPerRun` and by counting how often a sequence is read, never with
a clock, so they give the same answer under the race detector every time.

1. **`stallList(stalls []Stall) string`** returns the stalls as `code name`, separated by
   `", "`: `"A1 Noodle Bar, A2 Bao House"`, and `""` for no stalls.
   Budget: **at most one allocation**, whatever the number of stalls. Add up the length first,
   call `Grow` on a `strings.Builder`, and write the pieces without `fmt` or `+`.
2. **`stallCodes(stalls []Stall) []string`** returns every stall's code, in order.
   Budget: **at most one allocation**, and the slice's capacity equals its length.
3. **`summarize(takings iter.Seq[int]) Summary`** returns the number of takings, their total,
   the smallest and the largest (all in cents). Refunds are negative takings, so the smallest
   and largest can be negative. A night with no takings gives the zero `Summary`.
   Budget: the sequence is **read once**. In the market's real program it comes from the till's
   log file, and every extra pass reads the file again.
4. **`appendCents(dst []byte, cents int) []byte`** appends the amount as euros with exactly two
   decimals to `dst` and returns the extended slice, like `strconv.AppendInt`: `1250` is
   `12.50`, `5` is `0.05`, `-5` is `-0.05`, `0` is `0.00`.
   Budget: **no allocation** when `dst` has room. Use `strconv.AppendInt` for the whole euros and
   `append` for the rest; watch the sign of amounts under one euro.

```go
stalls := []Stall{{"A1", "Noodle Bar"}, {"A2", "Bao House"}, {"B7", "Churros"}}
stallList(stalls)  // "A1 Noodle Bar, A2 Bao House, B7 Churros"
stallCodes(stalls) // []string{"A1", "A2", "B7"}, with cap 3

summarize(slices.Values([]int{1250, 800, 4300, 650}))
// Summary{Count: 4, Total: 7000, Min: 650, Max: 4300}

appendCents([]byte("total: "), 7000) // "total: 70.00"
appendCents(nil, -5)                 // "-0.05"
```

To see the difference on your own machine, write a benchmark with `b.Loop` for the starter and
for your version and run `go test -bench . -benchmem` (without `-race`).
