A lab file cannot be a `_test.go` file, so in this lab you write the parts of a test that are
plain Go: the table of cases and the loop that checks them. The hidden tests then run your table
against the real rules and against broken versions of the charge, as `go test` would.

Complete the three functions in `solution.go`. Keep the types `chargeCase` and `reporter` as they
are.

1. **`lateCharge(daysLate int) int`** returns the charge in cents:
   - a wetsuit returned early (a negative `daysLate`), on time (0) or one day late costs 0: the
     first day late is a free grace day;
   - from the second day late, each day after the grace day costs 150 cents, so 2 days late is
     150 and 3 days late is 300;
   - the charge never goes above 1200 cents, the wetsuit's deposit.
2. **`chargeCases() []chargeCase`** returns your table of test cases for `lateCharge`, with at
   least six cases. Give every case a **different, non-empty `name`**, and work out every `want`
   by hand from the rules, not by calling `lateCharge`. Put cases on **both sides of every
   boundary**: an early return, on time, the grace day, the first charged day, the last day
   below the cap, the day the cap is reached, and a day past it. A hidden test runs your table
   against several broken versions of `lateCharge`, each breaking one rule, and your table must
   catch every one of them.
3. **`checkCharges(t reporter, charge func(daysLate int) int, cases []chargeCase)`** is the loop
   of a table-driven test:
   - call `t.Helper()` first, as a test helper should;
   - for every case, call `charge(c.days)`; when the result is not `c.want`, report it with
     `t.Errorf` in exactly this format: `"%s: charge(%d) = %d, want %d"` (name, days, got, want);
   - keep going after a failure, so that every wrong case is reported, and report nothing for
     the cases that pass.

`reporter` holds the two methods of `*testing.T` that `checkCharges` uses, so in a real
`charge_test.go` you would write:

```go
func TestLateCharge(t *testing.T) {
	checkCharges(t, lateCharge, chargeCases())
}
```

Example:

```go
lateCharge(-2) // 0
lateCharge(1)  // 0
lateCharge(2)  // 150
lateCharge(5)  // 600
lateCharge(30) // 1200

broken := func(daysLate int) int { return daysLate * 150 } // forgets the grace day and the cap
checkCharges(t, broken, []chargeCase{
	{name: "grace day", days: 1, want: 0},
	{name: "on time", days: 0, want: 0},
	{name: "past the cap", days: 12, want: 1200},
})
// reports two failures, in this order:
//   grace day: charge(1) = 150, want 0
//   past the cap: charge(12) = 1800, want 1200
```
