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

// Push adds v at the back of the queue.
func (q *Queue[T]) Push(v T) {
	q.items = append(q.items, v)
}

// Pop removes and returns the value at the front, or the zero value of T and
// false when the queue is empty.
func (q *Queue[T]) Pop() (T, bool) {
	if len(q.items) == 0 {
		var zero T
		return zero, false
	}
	front := q.items[0]
	q.items = q.items[1:]
	return front, true
}

// Len returns how many values are waiting.
func (q *Queue[T]) Len() int {
	return len(q.items)
}

// Map returns f applied to every waiting value, front first, without removing
// any of them.
func (q *Queue[T]) Map[U any](f func(T) U) []U {
	out := make([]U, 0, len(q.items))
	for _, v := range q.items {
		out = append(out, f(v))
	}
	return out
}

// Total adds up xs; the result has the same type as the values.
func Total[N Number](xs []N) N {
	var sum N
	for _, x := range xs {
		sum += x
	}
	return sum
}

// Tally counts how many times each value occurs in items.
func Tally[T comparable](items []T) map[T]int {
	counts := make(map[T]int)
	for _, item := range items {
		counts[item]++
	}
	return counts
}

// MaxBy returns the item with the largest key, the first one on a tie, and
// true; or the zero value of T and false when items is empty.
func MaxBy[T any, K cmp.Ordered](items []T, key func(T) K) (T, bool) {
	if len(items) == 0 {
		var zero T
		return zero, false
	}
	best, bestKey := items[0], key(items[0])
	for _, item := range items[1:] {
		if k := key(item); k > bestKey {
			best, bestKey = item, k
		}
	}
	return best, true
}
