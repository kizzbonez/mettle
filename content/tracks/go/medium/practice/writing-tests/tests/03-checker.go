import "fmt"

// checkerRecorder stands in for *testing.T and keeps what it was told.
type checkerRecorder struct {
	helperCalls int
	errors      []string
}

func (r *checkerRecorder) Helper() { r.helperCalls++ }

func (r *checkerRecorder) Errorf(format string, args ...any) {
	r.errors = append(r.errors, fmt.Sprintf(format, args...))
}

func Test(t *testing.T) {
	doubled := func(daysLate int) int { return daysLate * 2 }
	table := []chargeCase{
		{name: "first", days: 1, want: 5},
		{name: "second", days: 2, want: 4},
		{name: "third", days: 3, want: 0},
		{name: "fourth", days: 0, want: 0},
		{name: "fifth", days: -4, want: -1},
	}
	rec := &checkerRecorder{}
	checkCharges(rec, doubled, table)
	check.Equal(rec.errors, []string{
		"first: charge(1) = 2, want 5",
		"third: charge(3) = 6, want 0",
		"fifth: charge(-4) = -8, want -1",
	}, "every failing case is reported, in table order, in the exact format, and passing cases are not")
	check.True(rec.helperCalls >= 1, "checkCharges calls t.Helper()")

	calls := 0
	counting := func(daysLate int) int { calls++; return daysLate }
	quiet := &checkerRecorder{}
	checkCharges(quiet, counting, []chargeCase{{name: "a", days: 4, want: 4}, {name: "b", days: 7, want: 7}})
	check.Equal(len(quiet.errors), 0, "nothing is reported when every case passes")
	check.Equal(calls, 2, "charge is called once for each case")

	empty := &checkerRecorder{}
	checkCharges(empty, counting, nil)
	check.Equal(len(empty.errors), 0, "nothing is reported for an empty table")
}
