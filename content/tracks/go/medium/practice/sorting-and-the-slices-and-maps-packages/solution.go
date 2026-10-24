package main

import (
	"cmp"
	"slices"
)

// Trip is one boat trip leaving the wharf.
type Trip struct {
	Minute int    // minutes after midnight: 10*60 + 30 is 10:30
	Boat   string // such as "Heron"
}

// compareTrips orders trips by time, then by boat.
func compareTrips(a, b Trip) int {
	return cmp.Or(
		cmp.Compare(a.Minute, b.Minute),
		cmp.Compare(a.Boat, b.Boat),
	)
}

// sortTrips sorts ts in place by time, then by boat.
func sortTrips(ts []Trip) {
	slices.SortFunc(ts, compareTrips)
}

// nextTrip returns the first trip at or after now in a sorted board, or false
// when the last boat has gone.
func nextTrip(ts []Trip, now int) (Trip, bool) {
	i, _ := slices.BinarySearchFunc(ts, now, func(t Trip, minute int) int {
		return cmp.Compare(t.Minute, minute)
	})
	if i == len(ts) {
		return Trip{}, false
	}
	return ts[i], true
}

// addTrip inserts t into a sorted board at its place, unless the same trip is
// already there.
func addTrip(ts []Trip, t Trip) []Trip {
	i, found := slices.BinarySearchFunc(ts, t, compareTrips)
	if found {
		return ts
	}
	return slices.Insert(ts, i, t)
}

// boats returns every boat in ts once, in alphabetical order. It does not
// change ts.
func boats(ts []Trip) []string {
	names := make([]string, 0, len(ts))
	for _, t := range ts {
		names = append(names, t.Boat)
	}
	slices.Sort(names)
	return slices.Compact(names)
}
