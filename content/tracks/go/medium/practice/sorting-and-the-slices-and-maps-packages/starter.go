package main

// Add "cmp" and "slices" to the imports when your code uses them.

// Trip is one boat trip leaving the wharf.
type Trip struct {
	Minute int    // minutes after midnight: 10*60 + 30 is 10:30
	Boat   string // such as "Heron"
}

// Task 1: sort ts in place by time, then by boat.
func sortTrips(ts []Trip) {
	panic("not implemented")
}

// Task 2: return the first trip at or after now in a sorted board, or false
// when the last boat has gone.
func nextTrip(ts []Trip, now int) (Trip, bool) {
	panic("not implemented")
}

// Task 3: insert t into a sorted board at its place, unless the same trip is
// already there.
func addTrip(ts []Trip, t Trip) []Trip {
	panic("not implemented")
}

// Task 4: return every boat in ts once, in alphabetical order, without
// changing ts.
func boats(ts []Trip) []string {
	panic("not implemented")
}
