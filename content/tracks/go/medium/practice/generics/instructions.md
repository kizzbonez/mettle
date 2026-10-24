Complete the generic code in `solution.go`. The types, the constraint `Number` and every first
line are given: keep them exactly as they are, and write the bodies.

1. **`Queue[T]`**, a first-in, first-out queue of any type. `Push(v T)` adds `v` at the back.
   `Pop() (T, bool)` removes and returns the value at the **front** and `true`; on an empty queue
   it returns the zero value of `T` and `false` (write `var zero T`). `Len() int` returns how many
   values are waiting.
2. **`(q *Queue[T]) Map[U any](f func(T) U) []U`** is a Go 1.27 generic method: it returns
   `f` applied to every waiting value, front first, and leaves the queue unchanged. On an empty
   queue it returns an empty slice.
3. **`Total[N Number](xs []N) N`** adds up the values. It works for `int`, `float64` and named
   types based on them, such as `Cents`, and returns 0 for an empty slice.
4. **`Tally[T comparable](items []T) map[T]int`** counts how many times each value occurs.
5. **`MaxBy[T any, K cmp.Ordered](items []T, key func(T) K) (T, bool)`** returns the item whose
   `key` is largest, and `true`. When several items share the largest key, return the **first**
   of them. For an empty slice, return the zero value of `T` and `false`.

```go
washes := []Wash{
	{Number: 1, Programme: "basic", Price: 850},
	{Number: 2, Programme: "deluxe", Price: 1400},
	{Number: 3, Programme: "basic", Price: 850},
}
var line Queue[Wash]
for _, w := range washes {
	line.Push(w)
}
line.Map(func(w Wash) string { return w.Programme }) // []string{"basic", "deluxe", "basic"}
line.Len()                                           // 3
first, ok := line.Pop()                              // first.Number == 1, ok == true
line.Len()                                           // 2

Total([]Cents{850, 1400, 850})                        // Cents(3100)
Tally([]string{"basic", "deluxe", "basic"})           // map[string]int{"basic": 2, "deluxe": 1}
MaxBy(washes, func(w Wash) Cents { return w.Price })  // wash 2, true

var empty Queue[int]
empty.Pop() // 0, false
```
