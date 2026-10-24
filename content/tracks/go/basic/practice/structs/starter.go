package main

// You will need the package strings: add an import for it when you use it.

// Booking is one hire of tennis courts at the park.
type Booking struct {
	Name   string
	Courts int
	Hours  int
	Paid   bool
}

// Tally is what one person still owes.
type Tally struct {
	Bookings int // how many unpaid bookings
	Cents    int // their total cost
}

// newBooking returns a one-hour, unpaid booking of at least one court.
func newBooking(name string, courts int) Booking {
	panic("not implemented")
}

// cost returns the price of a booking in cents.
func cost(b Booking) int {
	panic("not implemented")
}

// payAll marks name's unpaid bookings as paid and returns how many it changed.
func payAll(bookings []Booking, name string) int {
	panic("not implemented")
}

// owed totals the unpaid bookings per lower-case name.
func owed(bookings []Booking) map[string]Tally {
	panic("not implemented")
}
