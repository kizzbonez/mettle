package main

import "strings"

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

// Prices in cents, per court.
const (
	firstHourCents = 1500
	extraHourCents = 800
)

// newBooking returns a one-hour, unpaid booking of at least one court.
func newBooking(name string, courts int) Booking {
	if courts < 1 {
		courts = 1
	}
	return Booking{Name: strings.TrimSpace(name), Courts: courts, Hours: 1}
}

// cost returns the price of a booking in cents.
func cost(b Booking) int {
	return b.Courts * (firstHourCents + extraHourCents*(b.Hours-1))
}

// payAll marks name's unpaid bookings as paid and returns how many it changed.
func payAll(bookings []Booking, name string) int {
	changed := 0
	for i := range bookings {
		// Index the slice: a range value would be a copy of the booking.
		if !bookings[i].Paid && strings.EqualFold(bookings[i].Name, name) {
			bookings[i].Paid = true
			changed++
		}
	}
	return changed
}

// owed totals the unpaid bookings per lower-case name.
func owed(bookings []Booking) map[string]Tally {
	totals := make(map[string]Tally)
	for _, b := range bookings {
		if b.Paid {
			continue
		}
		key := strings.ToLower(b.Name)
		// A struct in a map cannot be changed in place: copy it, change it, store it.
		t := totals[key]
		t.Bookings++
		t.Cents += cost(b)
		totals[key] = t
	}
	return totals
}
