import "fmt"

// exampleRecorder stands in for *testing.T and keeps what it was told.
type exampleRecorder struct {
	helperCalls int
	errors      []string
}

func (r *exampleRecorder) Helper() { r.helperCalls++ }

func (r *exampleRecorder) Errorf(format string, args ...any) {
	r.errors = append(r.errors, fmt.Sprintf(format, args...))
}

func Test(t *testing.T) {
	check.Equal(lateCharge(-2), 0, "lateCharge(-2)")
	check.Equal(lateCharge(1), 0, "lateCharge(1)")
	check.Equal(lateCharge(2), 150, "lateCharge(2)")
	check.Equal(lateCharge(5), 600, "lateCharge(5)")
	check.Equal(lateCharge(30), 1200, "lateCharge(30)")

	broken := func(daysLate int) int { return daysLate * 150 }
	rec := &exampleRecorder{}
	checkCharges(rec, broken, []chargeCase{
		{name: "grace day", days: 1, want: 0},
		{name: "on time", days: 0, want: 0},
		{name: "past the cap", days: 12, want: 1200},
	})
	check.Equal(rec.errors, []string{
		"grace day: charge(1) = 150, want 0",
		"past the cap: charge(12) = 1800, want 1200",
	}, "the failures checkCharges reports for the broken charge in the example")

	// The real test from the instructions: your table run against your lateCharge.
	checkCharges(t, lateCharge, chargeCases())
}
