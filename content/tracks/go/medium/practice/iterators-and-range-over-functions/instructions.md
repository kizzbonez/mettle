Complete the four functions in `solution.go`. Each of the first three returns an iterator: a
function that calls `yield` for each value and **returns as soon as `yield` returns false**. Add
`"strconv"` and `"strings"` to the imports when you use them.

1. **`bags(log string) iter.Seq[Bag]`** yields one `Bag` for each valid line of the weighing log,
   in order. Go through the lines with `strings.Lines` and split each one with `strings.Fields`
   (which also removes the `\n`, and the `\r` of Windows line endings). A valid line has exactly
   two fields: a zone, then a weight in kilograms that `strconv.ParseFloat(field, 64)` accepts and
   that is greater than 0. Skip every other line without stopping. Do not build a slice of all the
   bags first.
2. **`heavier(seq iter.Seq[Bag], minKg float64) iter.Seq[Bag]`** yields the bags of `seq` that
   weigh **at least** `minKg`, in order.
3. **`take[V any](seq iter.Seq[V], n int) iter.Seq[V]`** yields the first `n` values of `seq`, or
   all of them if there are fewer. It must never ask `seq` for more values than it yields: after
   the `n`th value, return at once. For `n` of 0 or less it yields nothing and does not ask `seq`
   for anything. `seq` may be endless.
4. **`differences(a, b iter.Seq[float64]) []float64`** compares two scales that weighed the same
   bags in the same order. It takes one reading from each at a time and returns `a - b` for each
   pair, stopping when either sequence runs out. Either sequence may be endless, so pull values
   with `iter.Pull`, and call both `stop` functions before returning (`defer`), so that an
   unfinished sequence is finished properly.

```go
log := "North 3.5\nSouth 1.25\n\nNorth heavy\nPier 6\nPier 0\n"
for b := range bags(log) {
	fmt.Println(b.Zone, b.Kg)
}
// North 3.5
// South 1.25
// Pier 6

slices.Collect(heavier(bags(log), 3.5)) // [{North 3.5} {Pier 6}]
slices.Collect(take(bags(log), 2))      // [{North 3.5} {South 1.25}]

scaleA := slices.Values([]float64{3.5, 1.25, 6})
scaleB := slices.Values([]float64{3.25, 1.5})
differences(scaleA, scaleB) // [0.25 -0.25]
```
