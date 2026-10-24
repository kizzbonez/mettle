package main

import (
	"iter"
	"strconv"
	"strings"
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

// stallList returns the stalls as "A1 Noodle Bar, A2 Bao House". It adds up
// the length first, so the builder allocates its buffer exactly once.
func stallList(stalls []Stall) string {
	size := 0
	for _, s := range stalls {
		size += len(s.Code) + 1 + len(s.Name) + len(", ")
	}
	var b strings.Builder
	b.Grow(size)
	for i, s := range stalls {
		if i > 0 {
			b.WriteString(", ")
		}
		b.WriteString(s.Code)
		b.WriteByte(' ')
		b.WriteString(s.Name)
	}
	return b.String()
}

// stallCodes returns the code of every stall, in order, in a slice that is
// allocated once with exactly the right capacity.
func stallCodes(stalls []Stall) []string {
	codes := make([]string, 0, len(stalls))
	for _, s := range stalls {
		codes = append(codes, s.Code)
	}
	return codes
}

// summarize reads the takings once and returns their count, total, smallest
// and largest. An empty sequence gives the zero Summary.
func summarize(takings iter.Seq[int]) Summary {
	var sum Summary
	for t := range takings {
		if sum.Count == 0 || t < sum.Min {
			sum.Min = t
		}
		if sum.Count == 0 || t > sum.Max {
			sum.Max = t
		}
		sum.Count++
		sum.Total += t
	}
	return sum
}

// appendCents appends cents as euros with two decimals ("12.50", "-0.05") to
// dst and returns the extended slice. It allocates only when dst is full.
func appendCents(dst []byte, cents int) []byte {
	if cents < 0 {
		dst = append(dst, '-')
		cents = -cents
	}
	dst = strconv.AppendInt(dst, int64(cents/100), 10)
	rest := cents % 100
	return append(dst, '.', byte('0'+rest/10), byte('0'+rest%10))
}
