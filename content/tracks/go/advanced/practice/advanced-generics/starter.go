package main

// waitingList is a priority queue: Next returns the item that goes first by
// the list's before function, and among equals the one added first.
//
// Give it the fields you need. Build the queue on container/heap with a
// type of your own that implements heap.Interface.
type waitingList[T any] struct {
}

// newWaitingList returns an empty list ordered by before, which reports
// whether a must be seen before b.
func newWaitingList[T any](before func(a, b T) bool) *waitingList[T] {
	panic("not implemented")
}

// Add puts v on the list.
func (w *waitingList[T]) Add(v T) {
	panic("not implemented")
}

// Next removes and returns the item that goes first, or false if the list
// is empty.
func (w *waitingList[T]) Next() (T, bool) {
	panic("not implemented")
}

// Peek returns the item that goes first without removing it, or false if
// the list is empty.
func (w *waitingList[T]) Peek() (T, bool) {
	panic("not implemented")
}

// Len reports how many items are waiting.
func (w *waitingList[T]) Len() int {
	panic("not implemented")
}

// Count reports how many waiting items share each key, leaving the list
// as it is. It is a generic method: K is its own type parameter.
func (w *waitingList[T]) Count[K comparable](key func(T) K) map[K]int {
	panic("not implemented")
}

// Urgent is satisfied by a type that can say whether it is more urgent
// than another value of the same type.
type Urgent[T Urgent[T]] interface {
	MoreUrgent(other T) bool
}

// byUrgency returns an empty list on which the most urgent item goes first.
func byUrgency[T Urgent[T]]() *waitingList[T] {
	panic("not implemented")
}
