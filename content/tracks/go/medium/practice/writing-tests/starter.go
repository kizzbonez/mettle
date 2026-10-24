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

// Task 1: lateCharge returns the charge in cents for a wetsuit returned
// daysLate days late.
func lateCharge(daysLate int) int {
	panic("not implemented")
}

// Task 2: chargeCases returns your table of test cases for lateCharge.
func chargeCases() []chargeCase {
	panic("not implemented")
}

// Task 3: checkCharges calls charge for every case and reports each case
// whose result is not the case's want.
func checkCharges(t reporter, charge func(daysLate int) int, cases []chargeCase) {
	panic("not implemented")
}
