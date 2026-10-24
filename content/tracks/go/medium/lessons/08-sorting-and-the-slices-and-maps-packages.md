---
title: Sorting, Searching and the slices and maps Packages
summary: Sort by any rule with slices.SortFunc, cmp.Compare and cmp.Or, keep ties in order with a stable sort, search sorted data with binary search, edit slices with Compact, Insert, Delete, Clone and Grow, and get ordered results out of maps.
minutes: 35
objectives:
  - Sort structs by several keys, ascending or descending, with slices.SortFunc, cmp.Compare and cmp.Or
  - Explain when a stable sort matters and use slices.SortStableFunc
  - Search a sorted slice with BinarySearch and BinarySearchFunc and insert at the position found
  - Edit slices and maps with the slices and maps packages, and print a map in a fixed order
---

## Outline

1. Sorting by your own rule
2. Stable sorting
3. Searching
4. Editing slices
5. Ordered results from maps
6. The older sort package, min and max

## Sorting by your own rule

Basic lesson 10 sorted numbers and strings with `slices.Sort`, which works for any element type
in `cmp.Ordered` (lesson 07). Structs have no natural order, so you say how to compare two of
them. `slices.SortFunc(s, cmp)` takes a **comparison function** that returns a negative number
when `a` comes first, a positive number when `b` comes first, and 0 when they are equal.
`cmp.Compare(x, y)` gives exactly that for one ordered value, and `cmp.Or` returns its first
argument that is not zero, which chains several keys:

```go
type Runner struct {
	Name string
	Club string
	Secs int
}

// in main:
runners := []Runner{
	{Name: "Ola", Club: "Harriers", Secs: 1395},
	{Name: "Ben", Club: "Striders", Secs: 1302},
	{Name: "Kim", Club: "Striders", Secs: 1450},
	{Name: "Ada", Club: "Harriers", Secs: 1302},
}
slices.SortFunc(runners, func(a, b Runner) int {
	return cmp.Or(
		cmp.Compare(a.Secs, b.Secs), // fastest first
		cmp.Compare(a.Name, b.Name), // then by name
	)
})
fmt.Println(runners)
```

```text
[{Ada Harriers 1302} {Ben Striders 1302} {Ola Harriers 1395} {Kim Striders 1450}]
```

Ada and Ben share a time, so the first comparison gives 0 and `cmp.Or` moves on to the names. To
sort in descending order, swap the arguments: `cmp.Compare(b.Secs, a.Secs)` puts the slowest
first. `cmp.Compare` is also safer than subtracting, which can overflow, and it orders a float
NaN consistently.

## Stable sorting

`SortFunc` is not **stable**: elements that compare equal may come out in any order. When the
existing order means something, such as finishing order, use `slices.SortStableFunc`, which keeps
equal elements as they were. Sorting the time-ordered runners by club keeps each club's runners
fastest first:

```go
slices.SortStableFunc(runners, func(a, b Runner) int {
	return cmp.Compare(a.Club, b.Club)
})
fmt.Println(runners)
```

```text
[{Ada Harriers 1302} {Ola Harriers 1395} {Ben Striders 1302} {Kim Striders 1450}]
```

When you can name every key, a full comparison with `cmp.Or` is clearer; a stable sort fits when
the earlier order came from somewhere else.

## Searching

`slices.Index` checks every element. On a **sorted** slice, `slices.BinarySearch` halves the
range at each step, so a million elements take about 20 comparisons. It returns a position and
whether the value is there; when it is not, the position is where it would go, ready for
`slices.Insert`. `BinarySearchFunc` searches by a key, and `IndexFunc` and `ContainsFunc` test
each element with a function, sorted or not:

```go
bibs := []int{104, 117, 120, 131, 158}
fmt.Println(slices.BinarySearch(bibs, 131))
i, found := slices.BinarySearch(bibs, 125)
fmt.Println(i, found)
if !found {
	bibs = slices.Insert(bibs, i, 125)
}
fmt.Println(bibs)

// byName holds Ada, Ben and Kim, sorted by name.
j, ok := slices.BinarySearchFunc(byName, "Ben", func(r Runner, name string) int {
	return cmp.Compare(r.Name, name)
})
fmt.Println(j, ok, byName[j].Secs)

k := slices.IndexFunc(byName, func(r Runner) bool { return r.Secs > 1400 })
fmt.Println(k, slices.ContainsFunc(byName, func(r Runner) bool {
	return strings.HasPrefix(r.Club, "Road")
}))
```

```text
3 true
3 false
[104 117 120 125 131 158]
1 true 1302
2 false
```

The function given to `BinarySearchFunc` compares an element with the target, and the slice must
be sorted by that same key.

## Editing slices

```go
clubs := []string{"Striders", "Harriers", "Striders", "Joggers", "Harriers"}

sorted := slices.Clone(clubs) // a copy: sorting it leaves clubs alone
slices.Sort(sorted)
unique := slices.Compact(sorted)
fmt.Println(unique, clubs)

unique = slices.Delete(unique, 1, 2) // remove index 1
fmt.Println(unique)

times := make([]int, 0)
times = slices.Grow(times, 100)
fmt.Println(len(times), cap(times) >= 100)

fmt.Println(slices.Compact([]int{1, 1, 2, 1}))
```

```text
[Harriers Joggers Striders] [Striders Harriers Striders Joggers Harriers]
[Harriers Striders]
0 true
[1 2 1]
```

- `Clone` makes a copy with its own backing array. Sorting works in place, so clone first when
  the caller's slice must not change (Basic lesson 10's aliasing).
- `Compact` replaces each run of equal neighbours with one element, like the Unix `uniq`. It
  only sees neighbours, so sort first: the last line kept the second `1`.
- `Delete(s, i, j)` removes `s[i:j]`, and `Insert(s, i, v...)` adds before index `i`.
- `Grow(s, n)` makes room for `n` more elements without changing the length, so the appends
  that follow do not reallocate.

`Compact`, `Delete` and `Insert` return the new slice. Always assign the result.

## Ordered results from maps

Basic lesson 11 showed that ranging over a map gives a random order. `maps.Keys` and
`maps.Values` return **iterators**, values you can range over or collect, which the next lesson
explains. `slices.Sorted` collects and sorts them; `slices.Collect` collects them in the order
they come:

```go
finishers := map[string]int{"Striders": 14, "Harriers": 9, "Joggers": 3, "Pacers": 0}

fmt.Println(slices.Sorted(maps.Keys(finishers)))
counts := slices.Collect(maps.Values(finishers))
slices.Sort(counts)
fmt.Println(counts)

active := maps.Clone(finishers)
maps.DeleteFunc(active, func(club string, n int) bool { return n == 0 })
fmt.Println(len(finishers), len(active))
```

```text
[Harriers Joggers Pacers Striders]
[0 3 9 14]
4 3
```

`maps.Clone` copies the map, and `maps.DeleteFunc` deletes every entry for which the function
returns true.

## The older sort package, min and max

Before generics, code sorted with package `sort`:

```go
secs := []int{1395, 1302, 1450}
sort.Slice(secs, func(i, j int) bool { return secs[i] < secs[j] })
fmt.Println(secs)
fmt.Println(min(1395, 1302, 1450), max(2.5, 1.0), min("oak", "ash"))
```

```text
[1302 1395 1450]
1302 2.5 ash
```

`sort.Slice` takes `any` and a "less" function over indexes, so the compiler cannot check that
they match. Its documentation now points to `slices.SortFunc` as more ergonomic and faster, and
`sort.Ints` simply calls `slices.Sort`. Read `sort` in older code; write `slices`. The built-in
functions `min` and `max` take any number of ordered arguments of one type.

## Common mistakes

- **Returning a `bool` from the comparison.** `func(a, b Runner) bool` is refused: `type
  func(a Runner, b Runner) bool of func(a, b Runner) bool {…} does not match inferred type
  func(a Runner, b Runner) int for func(a E, b E) int`. Return `cmp.Compare(...)`.
- **Binary search on an unsorted slice.** `slices.BinarySearch([]int{131, 104, 158, 117}, 104)`
  returns `0 false` although 104 is there. Sort first, by the same key.
- **Ignoring the result.** `slices.Compact(clubs)` on its own leaves `[a b ]` in a slice that was
  `[a a b]`, with a zeroed tail; `go vet` says `result of slices.Compact call not used`.
- **Sorting a slice you were given.** It changes the caller's data. Clone first.

## Practice

1. Sort `[]string{"pace", "run", "lap", "sprint"}` by length, then alphabetically.
2. Write `insertSorted(xs []int, v int) []int` that keeps a sorted slice sorted and adds no
   duplicates.
3. List the clubs of `finishers` by number of finishers, most first, then by name.

### Answers

```go
func insertSorted(xs []int, v int) []int {
	i, found := slices.BinarySearch(xs, v)
	if found {
		return xs
	}
	return slices.Insert(xs, i, v)
}

func main() {
	words := []string{"pace", "run", "lap", "sprint"}
	slices.SortFunc(words, func(a, b string) int {
		return cmp.Or(cmp.Compare(len(a), len(b)), cmp.Compare(a, b))
	})
	fmt.Println(words)

	bibs := []int{104, 120}
	bibs = insertSorted(bibs, 117)
	bibs = insertSorted(bibs, 120)
	fmt.Println(bibs)

	finishers := map[string]int{"Striders": 14, "Harriers": 9, "Joggers": 14}
	clubs := slices.SortedFunc(maps.Keys(finishers), func(a, b string) int {
		return cmp.Or(cmp.Compare(finishers[b], finishers[a]), cmp.Compare(a, b))
	})
	fmt.Println(clubs)
}
```

```text
[lap run pace sprint]
[104 117 120]
[Joggers Striders Harriers]
```

## Key takeaways

- `slices.SortFunc` with `cmp.Compare` sorts by any key; `cmp.Or` chains keys; swap the
  arguments for descending order.
- `SortStableFunc` keeps equal elements in their earlier order.
- `BinarySearch` needs sorted data and returns the insertion point when the value is missing.
- `Compact`, `Delete` and `Insert` return the new slice; `Clone` before sorting someone else's.
- `slices.Sorted(maps.Keys(m))` gives a map's keys in order; new code uses `slices`, not `sort`.

## Further reading

- [Package slices](https://pkg.go.dev/slices)
- [Package maps](https://pkg.go.dev/maps)
- [Package cmp](https://pkg.go.dev/cmp)
- [Go by Example: Sorting by Functions](https://gobyexample.com/sorting-by-functions)
