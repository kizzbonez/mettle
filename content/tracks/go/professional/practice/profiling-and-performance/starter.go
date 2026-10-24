package main

import (
	"fmt"
	"iter"
)

// Stall is one stall at the street food festival.
type Stall struct {
	Code string // "A1", "B12"
	Name string // "Noodle Bar"
}

// Summary sums up one night's takings, in cents.
type Summary struct {
	Count int
	Total int
	Min   int
	Max   int
}

// The four functions below give the right answers, but they are slow and
// allocate too much. Rewrite each one to meet the budget in the instructions,
// without changing what it returns.

// Task 1: stallList returns the stalls as "A1 Noodle Bar, A2 Bao House".
func stallList(stalls []Stall) string {
	list := ""
	for i, s := range stalls {
		if i > 0 {
			list += ", "
		}
		list += fmt.Sprintf("%s %s", s.Code, s.Name)
	}
	return list
}

// Task 2: stallCodes returns the code of every stall, in order.
func stallCodes(stalls []Stall) []string {
	var codes []string
	for _, s := range stalls {
		codes = append(codes, s.Code)
	}
	return codes
}

// Task 3: summarize returns the count, total, smallest and largest takings.
func summarize(takings iter.Seq[int]) Summary {
	var sum Summary
	for t := range takings {
		sum.Count++
		sum.Total += t
	}
	first := true
	for t := range takings {
		if first || t < sum.Min {
			sum.Min = t
		}
		first = false
	}
	first = true
	for t := range takings {
		if first || t > sum.Max {
			sum.Max = t
		}
		first = false
	}
	return sum
}

// Task 4: appendCents appends cents as euros with two decimals ("12.50") to dst.
func appendCents(dst []byte, cents int) []byte {
	return append(dst, fmt.Sprintf("%.2f", float64(cents)/100)...)
}
