package main

import (
	"iter"
	"strconv"
	"strings"
)

// Bag is one bag of litter weighed at the beach clean.
type Bag struct {
	Zone string
	Kg   float64
}

// bags yields the bags in a weighing log, one per valid line, in order. It
// reads the log lazily and stops as soon as the loop does.
func bags(log string) iter.Seq[Bag] {
	return func(yield func(Bag) bool) {
		for line := range strings.Lines(log) {
			fields := strings.Fields(line)
			if len(fields) != 2 {
				continue // blank or malformed
			}
			kg, err := strconv.ParseFloat(fields[1], 64)
			if err != nil || kg <= 0 {
				continue
			}
			if !yield(Bag{Zone: fields[0], Kg: kg}) {
				return
			}
		}
	}
}

// heavier yields the bags of seq that weigh at least minKg.
func heavier(seq iter.Seq[Bag], minKg float64) iter.Seq[Bag] {
	return func(yield func(Bag) bool) {
		for b := range seq {
			if b.Kg >= minKg && !yield(b) {
				return
			}
		}
	}
}

// take yields at most the first n values of seq, and never asks seq for more.
func take[V any](seq iter.Seq[V], n int) iter.Seq[V] {
	return func(yield func(V) bool) {
		if n <= 0 {
			return
		}
		count := 0
		for v := range seq {
			if !yield(v) {
				return
			}
			count++
			if count == n {
				return
			}
		}
	}
}

// differences pairs the readings of two scales in order and returns a - b for
// each pair, stopping when either scale runs out.
func differences(a, b iter.Seq[float64]) []float64 {
	nextA, stopA := iter.Pull(a)
	defer stopA()
	nextB, stopB := iter.Pull(b)
	defer stopB()

	var diffs []float64
	for {
		x, okA := nextA()
		y, okB := nextB()
		if !okA || !okB {
			return diffs
		}
		diffs = append(diffs, x-y)
	}
}
