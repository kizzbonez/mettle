package main

import "context"

// crates sends the weight of every crate that is not empty, in delivery
// order, and closes the channel when it is done or when ctx is done.
func crates(ctx context.Context, weights []int) <-chan int {
	panic("not implemented")
}

// merge copies every belt onto one channel, which it closes once every
// copier has finished.
func merge(ctx context.Context, belts ...<-chan int) <-chan int {
	panic("not implemented")
}

// pressAll presses every weight with at most presses presses at once and
// returns the litres in the order of weights, or the first error.
func pressAll(ctx context.Context, weights []int, presses int, press func(ctx context.Context, kg int) (int, error)) ([]int, error) {
	panic("not implemented")
}
