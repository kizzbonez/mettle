package main

// Add "strconv" and "strings" to the imports when your code uses them.
import "iter"

// Bag is one bag of litter weighed at the beach clean.
type Bag struct {
	Zone string
	Kg   float64
}

// Task 1: yield the bags in a weighing log, one per valid line, in order.
// Read the log lazily and stop as soon as the loop does.
func bags(log string) iter.Seq[Bag] {
	panic("not implemented")
}

// Task 2: yield the bags of seq that weigh at least minKg.
func heavier(seq iter.Seq[Bag], minKg float64) iter.Seq[Bag] {
	panic("not implemented")
}

// Task 3: yield at most the first n values of seq, and never ask seq for more.
func take[V any](seq iter.Seq[V], n int) iter.Seq[V] {
	panic("not implemented")
}

// Task 4: pair the readings of two scales in order and return a - b for each
// pair, stopping when either scale runs out. Use iter.Pull.
func differences(a, b iter.Seq[float64]) []float64 {
	panic("not implemented")
}
