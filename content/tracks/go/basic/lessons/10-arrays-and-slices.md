---
title: Arrays and Slices
summary: Store lists of values in fixed-length arrays and growable slices, use make, len, cap, append and copy, see how slicing shares memory, tell nil from empty slices, build 2D slices, and use the slices package to search, sort, compare and delete.
minutes: 40
objectives:
  - Explain why an array's length is part of its type and why assigning an array copies it
  - Create slices with literals and make, grow them with append, and say what len and cap report
  - Predict when two slices share elements, and avoid it with copy or a full slice expression
  - Use slices.Contains, Index, Sort, Max, Min, Equal, Reverse and Delete
---

## Outline

1. Arrays: a fixed number of values
2. Slices: literals, make, len and cap
3. Slicing shares the array
4. copy, nil and empty
5. range, and slices of slices
6. The slices package
7. Strings to slices

## Arrays: a fixed number of values

An **array** holds a fixed number of values of one type, its **elements**, numbered from 0. The
length is part of the type: `[7]int` and `[3]int` are different types.

```go
package main

import "fmt"

func main() {
	var week [7]int
	week[0] = 120
	week[6] = 340
	fmt.Println(week, len(week))

	lanes := [3]string{"fast", "medium", "slow"}
	spare := lanes
	spare[0] = "closed"
	fmt.Println(lanes, spare)
}
```

```text
[120 0 0 0 0 0 340] 7
[fast medium slow] [closed medium slow]
```

Unset elements hold the zero value. An array is a value: `spare := lanes` copies all three
strings, so changing `spare` leaves `lanes` alone, and passing an array to a function copies it
too. The compiler checks constant indexes: `week[7]` is
`invalid argument: index 7 out of bounds [0:7]`, and `a = b` with a `[4]int` into a `[3]int` is
`cannot use b (variable of type [4]int) as [3]int value in assignment`. Arrays suit things whose
size never changes, such as the days of a week. For everything else Go has slices.

## Slices: literals, make, len and cap

A **slice** is a view of a run of elements in an array, the **backing array**, that Go manages
for you. Its type has no length: `[]string`.

```go
package main

import "fmt"

func main() {
	stops := []string{"Oban", "Craignure"}
	stops = append(stops, "Fionnphort", "Iona")
	fmt.Println(stops, len(stops))

	seats := make([]int, 3)
	queue := make([]string, 0, 10)
	fmt.Println(seats, len(seats), cap(seats), len(queue), cap(queue))

	var nums []int
	for i := range 5 {
		nums = append(nums, i)
		fmt.Print(len(nums), "/", cap(nums), " ")
	}
	fmt.Println()
}
```

```text
[Oban Craignure Fionnphort Iona] 4
[0 0 0] 3 3 0 10
1/1 2/2 3/4 4/4 5/8 
```

- `len(s)` is the number of elements the slice shows; `cap(s)`, its **capacity**, is how many fit
  in the backing array from the slice's start.
- `make([]int, 3)` makes a slice of three zero values. `make([]string, 0, 10)` makes an empty
  slice with room for ten, useful when you know roughly how many you will add.
- `append(s, values...)` adds to the end and returns the resulting slice. When the capacity is
  used up, it allocates a bigger array and copies the elements: here the capacity doubled. The
  exact growth is the runtime's business; do not depend on it.

Because `append` may return a new slice, always assign its result, usually to the same variable.
A bare `append(stops, "Iona")` does not compile:
`append(stops, "Iona") (value of type []string) is not used`.

## Slicing shares the array

`s[lo:hi]` makes a slice of the elements from index `lo` up to, but not including, `hi`, as for
strings in lesson 05. It copies nothing: both slices show the same backing array.

```go
package main

import "fmt"

func main() {
	scores := []int{70, 85, 90, 60, 75}
	top := scores[1:3]
	fmt.Println(top, len(top), cap(top))

	top[0] = 0
	fmt.Println(scores)

	top = append(top, 99)
	fmt.Println(scores)

	safe := scores[1:3:3]
	safe = append(safe, 11)
	fmt.Println(scores, safe)
}
```

```text
[85 90] 2 4
[70 0 90 60 75]
[70 0 90 99 75]
[70 0 90 99 75] [0 90 11]
```

Writing `top[0]` changed `scores[1]`. Worse, `top` had spare capacity, so `append` wrote 99 into
`scores[3]` and overwrote 60. This **aliasing** is the classic slice bug. The **full slice
expression** `s[lo:hi:max]` limits the capacity to `max - lo`, so the next append must copy, and
`safe` leaves `scores` untouched.

## copy, nil and empty

`copy(dst, src)` copies elements into an existing slice and returns how many it copied, the
smaller of the two lengths. Use it when you need an independent copy:

```go
package main

import "fmt"

func main() {
	src := []int{1, 2, 3}
	dst := make([]int, len(src))
	n := copy(dst, src)
	dst[0] = 100
	fmt.Println(n, src, dst)

	var none []string
	empty := []string{}
	fmt.Println(none == nil, empty == nil, len(none), len(empty))
	fmt.Printf("%#v %#v\n", none, empty)
	none = append(none, "first")
	fmt.Println(none)
}
```

```text
3 [1 2 3] [100 2 3]
true false 0 0
[]string(nil) []string{}
[first]
```

The zero value of a slice is `nil`: no backing array at all. A **nil slice** and an empty slice
both have length 0, `range` runs zero times over both, and `append` works on both, so
`var result []string` is the usual way to start a list. Check `len(s) == 0`, not `s == nil`.

## range, and slices of slices

`range` gives each index and a **copy** of each element, so to change elements, assign through
the index. A slice of slices makes a grid, and its rows may differ in length:

```go
package main

import (
	"fmt"
	"strings"
)

func main() {
	hall := make([][]string, 3)
	for r := range hall {
		hall[r] = make([]string, 4)
		for s := range hall[r] {
			hall[r][s] = "."
		}
	}
	hall[1][2] = "X"
	for _, row := range hall {
		fmt.Println(strings.Join(row, " "))
	}

	ragged := [][]int{{1, 2}, {3, 4, 5}, {}}
	fmt.Println(ragged, len(ragged[1]))
}
```

```text
. . . .
. . X .
. . . .
[[1 2] [3 4 5] []] 3
```

Each row must be made on its own; `make([][]string, 3)` makes only three nil rows.

## The slices package

The standard package `slices` has the everyday operations:

```go
package main

import (
	"fmt"
	"slices"
)

func main() {
	isles := []string{"Mull", "Coll", "Iona", "Tiree"}
	fmt.Println(slices.Contains(isles, "Iona"), slices.Index(isles, "Coll"), slices.Index(isles, "Skye"))
	slices.Sort(isles)
	fmt.Println(isles)

	nums := []int{7, 3, 9, 1}
	fmt.Println(slices.Max(nums), slices.Min(nums))
	slices.Reverse(nums)
	fmt.Println(nums, slices.Equal(nums, []int{1, 9, 3, 7}))
	nums = slices.Delete(nums, 1, 2)
	fmt.Println(nums)
}
```

```text
true 1 -1
[Coll Iona Mull Tiree]
9 1
[1 9 3 7] true
[1 3 7]
```

`Index` returns -1 when the value is missing. `Sort` and `Reverse` change the slice in place.
`Delete(s, i, j)` removes `s[i:j]` and returns the shorter slice, so assign it as with append.
`Sort`, `Max` and `Min` work for any element type that can be ordered with `<`; Medium 07
explains how one function can do that. Slices cannot be compared with `==`
(`invalid operation: a == b (slice can only be compared to nil)`): use `slices.Equal`.

## Strings to slices

`strings.Split` and `strings.Fields` from lesson 05 return a `[]string`, which you now know how
to index, measure and range over:

```go
package main

import (
	"fmt"
	"strings"
)

func main() {
	stops := strings.Split("Oban,Craignure,Fionnphort", ",")
	words := strings.Fields("  two   ferries today ")
	fmt.Println(len(stops), stops[2], len(words), words)
	fmt.Printf("%q\n", words)
}
```

```text
3 Fionnphort 3 [two ferries today]
["two" "ferries" "today"]
```

## Common mistakes

- **`make` with a length, then `append`.** `queue := make([]string, 3)` followed by
  `append(queue, "Ada")` gives `["" "" "" "Ada"]`. Use `make([]string, 0, 3)`.
- **Reading past the end.** `stops[len(stops)]` panics:
  `index out of range [3] with length 3`. The last element is `s[len(s)-1]`.
- **A sub-slice that changes the original.** Copy first, or use `s[lo:hi:hi]`.
- **Changing the range copy.** `for _, p := range prices { p *= 2 }` leaves `prices` as it was;
  write `prices[i] *= 2`.
- **Max of nothing.** `slices.Max` and `slices.Min` panic on an empty slice
  (`panic: slices.Max: empty list`). Check the length first.

## Practice

1. Write `last(s []string) (string, bool)`, returning `false` for an empty slice.
2. Remove `"Coll"` from `[]string{"Mull", "Coll", "Iona"}` with `slices.Index` and
   `slices.Delete`.
3. Sort a copy of `[]int{40, 15, 30}` and print both, the original unchanged.

### Answers

```go
package main

import (
	"fmt"
	"slices"
)

func last(s []string) (string, bool) {
	if len(s) == 0 {
		return "", false
	}
	return s[len(s)-1], true
}

func main() {
	fmt.Println(last([]string{"Oban", "Iona"}))
	fmt.Println(last(nil))

	isles := []string{"Mull", "Coll", "Iona"}
	if i := slices.Index(isles, "Coll"); i >= 0 {
		isles = slices.Delete(isles, i, i+1)
	}
	fmt.Println(isles)

	times := []int{40, 15, 30}
	sorted := make([]int, len(times))
	copy(sorted, times)
	slices.Sort(sorted)
	fmt.Println(times, sorted)
}
```

```text
Iona true
 false
[Mull Iona]
[40 15 30] [15 30 40]
```

## Key takeaways

- An array's length is part of its type, and assigning it copies every element.
- A slice is a view of a backing array with a length and a capacity; `s = append(s, v)`.
- Slicing shares elements; copy, or limit the capacity with `s[lo:hi:max]`, when that matters.
- A nil slice has length 0 and works with `len`, `range` and `append`.
- `slices` has Contains, Index, Sort, Max, Min, Equal, Reverse and Delete; compare with
  `slices.Equal`, not `==`.

## Further reading

- [The Go Programming Language Specification: Slice types](https://go.dev/ref/spec#Slice_types)
- [Go blog: Go Slices: usage and internals](https://go.dev/blog/slices-intro)
- [Package slices](https://pkg.go.dev/slices)
- [Learn Go with Tests: Arrays and slices](https://quii.gitbook.io/learn-go-with-tests/go-fundamentals/arrays-and-slices)
