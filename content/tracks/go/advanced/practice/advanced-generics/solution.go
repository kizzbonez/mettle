package main

import "container/heap"

// entry is one waiting item with its arrival number, which breaks ties.
type entry[T any] struct {
	value T
	seq   int
}

// entries adapts the waiting items to heap.Interface.
type entries[T any] struct {
	items  []entry[T]
	before func(a, b T) bool
}

func (e *entries[T]) Len() int { return len(e.items) }

// Less puts the item that goes first by before first, and among items
// that neither goes before, the one that arrived first.
func (e *entries[T]) Less(i, j int) bool {
	a, b := e.items[i], e.items[j]
	switch {
	case e.before(a.value, b.value):
		return true
	case e.before(b.value, a.value):
		return false
	}
	return a.seq < b.seq
}

func (e *entries[T]) Swap(i, j int) { e.items[i], e.items[j] = e.items[j], e.items[i] }
func (e *entries[T]) Push(x any)    { e.items = append(e.items, x.(entry[T])) }

func (e *entries[T]) Pop() any {
	last := e.items[len(e.items)-1]
	e.items = e.items[:len(e.items)-1]
	return last
}

// waitingList is a priority queue: Next returns the item that goes first by
// the list's before function, and among equals the one added first.
type waitingList[T any] struct {
	queue   entries[T]
	arrived int // how many items have ever been added
}

// newWaitingList returns an empty list ordered by before, which reports
// whether a must be seen before b.
func newWaitingList[T any](before func(a, b T) bool) *waitingList[T] {
	return &waitingList[T]{queue: entries[T]{before: before}}
}

// Add puts v on the list.
func (w *waitingList[T]) Add(v T) {
	heap.Push(&w.queue, entry[T]{value: v, seq: w.arrived})
	w.arrived++
}

// Next removes and returns the item that goes first, or false if the list
// is empty.
func (w *waitingList[T]) Next() (T, bool) {
	if w.queue.Len() == 0 {
		var zero T
		return zero, false
	}
	return heap.Pop(&w.queue).(entry[T]).value, true
}

// Peek returns the item that goes first without removing it, or false if
// the list is empty.
func (w *waitingList[T]) Peek() (T, bool) {
	if w.queue.Len() == 0 {
		var zero T
		return zero, false
	}
	return w.queue.items[0].value, true
}

// Len reports how many items are waiting.
func (w *waitingList[T]) Len() int { return w.queue.Len() }

// Count reports how many waiting items share each key, leaving the list
// as it is. It is a generic method: K is its own type parameter.
func (w *waitingList[T]) Count[K comparable](key func(T) K) map[K]int {
	counts := make(map[K]int)
	for _, e := range w.queue.items {
		counts[key(e.value)]++
	}
	return counts
}

// Urgent is satisfied by a type that can say whether it is more urgent
// than another value of the same type.
type Urgent[T Urgent[T]] interface {
	MoreUrgent(other T) bool
}

// byUrgency returns an empty list on which the most urgent item goes first.
func byUrgency[T Urgent[T]]() *waitingList[T] {
	return newWaitingList(func(a, b T) bool { return a.MoreUrgent(b) })
}
