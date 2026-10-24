package main

// chargeCase is one row of the test table for lateCharge.
type chargeCase struct {
	name string // a short description, used like a subtest name
	days int    // days late; 0 is on time and a negative number is early
	want int    // the charge you expect, in cents, worked out from the rules
}

// reporter is the part of *testing.T that checkCharges needs. A *testing.T
// has both methods, so a real test can call checkCharges(t, ...).
type reporter interface {
	Helper()
	Errorf(format string, args ...any)
}

const (
	graceDays    = 1    // the first day late is free
	centsPerDay  = 150  // each further day late
	maximumCents = 1200 // the charge never goes above the deposit
)

// lateCharge returns the charge in cents for a wetsuit returned daysLate
// days late. Early and on-time returns cost nothing.
func lateCharge(daysLate int) int {
	if daysLate <= graceDays {
		return 0
	}
	return min((daysLate-graceDays)*centsPerDay, maximumCents)
}

// chargeCases returns the test table for lateCharge. The cases sit on both
// sides of every rule's boundary, and every want is worked out by hand.
func chargeCases() []chargeCase {
	return []chargeCase{
		{name: "returned early", days: -3, want: 0},
		{name: "on time", days: 0, want: 0},
		{name: "grace day", days: 1, want: 0},
		{name: "first charged day", days: 2, want: 150},
		{name: "day before the cap", days: 8, want: 1050},
		{name: "reaches the cap", days: 9, want: 1200},
		{name: "past the cap", days: 10, want: 1200},
		{name: "lost at sea", days: 60, want: 1200},
	}
}

// checkCharges calls charge for every case and reports each case whose
// result differs from its want. It keeps going after a failure, so one run
// shows every wrong case.
func checkCharges(t reporter, charge func(daysLate int) int, cases []chargeCase) {
	t.Helper()
	for _, c := range cases {
		if got := charge(c.days); got != c.want {
			t.Errorf("%s: charge(%d) = %d, want %d", c.name, c.days, got, c.want)
		}
	}
}
