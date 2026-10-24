package main

import "cmp"

// Cents is an amount of money in cents.
type Cents int

// Wash is one car waiting in the queue at the car wash.
type Wash struct {
	Number    int    // the ticket number
	Programme string // such as "deluxe"
	Price     Cents
}

// Number is the set of types Total can add up.
type Number interface {
	~int | ~float64
}

// Queue is a first-in, first-out line of values of one type.
type Queue[T any] struct {
	items []T
}

// Task 1: add v at the back of the queue.
func (q *Queue[T]) Push(v T) {
	panic("not implemented")
}

// Task 1: remove and return the value at the front, or the zero value of T
// and false when the queue is empty.
func (q *Queue[T]) Pop() (T, bool) {
	panic("not implemented")
}

// Task 1: return how many values are waiting.
func (q *Queue[T]) Len() int {
	panic("not implemented")
}

// Task 2: return f applied to every waiting value, front first, without
// removing any of them.
func (q *Queue[T]) Map[U any](f func(T) U) []U {
	panic("not implemented")
}

// Task 3: add up xs; the result has the same type as the values.
func Total[N Number](xs []N) N {
	panic("not implemented")
}

// Task 4: count how many times each value occurs in items.
func Tally[T comparable](items []T) map[T]int {
	panic("not implemented")
}

// Task 5: return the item with the largest key, the first one on a tie, and
// true; or the zero value of T and false when items is empty.
func MaxBy[T any, K cmp.Ordered](items []T, key func(T) K) (T, bool) {
	panic("not implemented")
}
