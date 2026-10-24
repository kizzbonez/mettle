Complete `solution.go`. Everything is generic, so the same waiting list serves the pets in the
waiting room and the phone calls the nurse must return. The starter declares every type and
function with its exact signature; give `waitingList` its fields and write the bodies.

1. **The heap.** Build the queue on `container/heap`. Declare a type of your own that implements
   `heap.Interface` (`Len`, `Less`, `Swap`, `Push(x any)`, `Pop() any`) over a slice, and keep
   one in `waitingList`. Methods named `Push` and `Pop` would clash with `heap.Interface` on
   `waitingList` itself, which is why the list's own methods are called `Add` and `Next`.
2. **`newWaitingList[T any](before func(a, b T) bool) *waitingList[T]`** returns an empty list.
   `before(a, b)` reports whether `a` must be seen before `b`.
3. **Ties go to whoever came first.** When neither of two items is `before` the other, the one
   added first comes out first. A heap alone does not keep that order: give every item an
   arrival number when it is added, and let `Less` compare those numbers when `before` does not
   decide.
4. **`Add(v T)`**, **`Next() (T, bool)`**, **`Peek() (T, bool)`** and **`Len() int`**. `Next`
   removes and returns the item that goes first; `Peek` returns it and leaves it on the list.
   On an empty list both return the zero value of `T` and `false`.
5. **`Count[K comparable](key func(T) K) map[K]int`** is a **generic method** (Go 1.27): it has
   its own type parameter `K`. It returns how many waiting items give each key, and leaves the
   list exactly as it was. On an empty list it returns an empty map.
6. **`byUrgency[T Urgent[T]]() *waitingList[T]`** returns an empty list on which an item that is
   `MoreUrgent` than another goes first. `Urgent` is the self-referential constraint from lesson
   09, already declared for you.

The tests declare their own types, whose names all start with `test`; give your own
declarations other names.

Example:

```go
type pet struct {
	name, species string
	urgency       int // 3 is an emergency, 1 can wait
}

func (p pet) MoreUrgent(q pet) bool { return p.urgency > q.urgency }

room := byUrgency[pet]()
room.Add(pet{"Biscuit", "dog", 1})
room.Add(pet{"Pepper", "cat", 3})
room.Add(pet{"Mochi", "rabbit", 1})
room.Add(pet{"Rolo", "dog", 2})

room.Count(func(p pet) string { return p.species }) // map[cat:1 dog:2 rabbit:1]
room.Peek()                                         // {Pepper cat 3} true
room.Len()                                          // 4
room.Next() // {Pepper cat 3} true
room.Next() // {Rolo dog 2} true
room.Next() // {Biscuit dog 1} true: Biscuit came before Mochi
room.Next() // {Mochi rabbit 1} true
room.Next() // {  0} false

calls := newWaitingList(func(a, b string) bool { return len(a) < len(b) })
calls.Add("Mrs Okafor")
calls.Add("Lee")
calls.Next() // Lee true: the shorter name goes first
```
