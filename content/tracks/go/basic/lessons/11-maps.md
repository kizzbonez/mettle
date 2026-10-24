---
title: Maps
summary: Store values under keys with Go's built-in map type, tell a missing key from a stored zero with the comma-ok idiom, delete entries, loop in a stable order, count and group with maps, and avoid the nil-map panic.
minutes: 35
objectives:
  - Create maps with literals and make, and read, write, delete and count their entries
  - Tell a missing key from a stored zero value with the comma-ok idiom
  - Loop over a map in a stable order by sorting its keys
  - Explain the nil-map panic, which types can be keys, and why a function can change a map it is given
---

## Outline

1. A map is a lookup table
2. Missing keys and the comma-ok idiom
3. Deleting entries and looping in order
4. Counting and grouping
5. The nil map
6. Which types can be keys
7. Maps are shared, not copied

## A map is a lookup table

A slice finds an element by its position. Often you want to find a value by a name instead: the
stock of a vegetable, the score of a player. A **map** stores **key**-value pairs and finds the
value for a key quickly, however many entries it holds. Its type is written `map[K]V`, so
`map[string]int` maps strings to ints. Keys are unique: assigning to a key that is already there
replaces its value.

```go
package main

import "fmt"

func main() {
	stock := map[string]int{
		"leeks":   12,
		"carrots": 30,
	}
	stock["onions"] = 25 // a new key adds an entry
	stock["leeks"] = 10  // an existing key replaces the value
	fmt.Println(stock["carrots"], len(stock))
	fmt.Println(stock)
}
```

```text
30 3
map[carrots:30 leeks:10 onions:25]
```

The braces hold a **map literal**: one `key: value` per entry, separated by commas, with a comma
after the last one too when the closing brace is on a line of its own. `len` counts the entries. `fmt` prints a map with its keys sorted, which makes output easy to read but
says nothing about how the map keeps them.

An empty map is `map[string]int{}` or `make(map[string]int)`. `make` takes an optional size hint,
`make(map[string]int, 500)`, which saves the map from growing step by step when you know roughly
how many entries are coming. It is a hint, not a limit.

## Missing keys and the comma-ok idiom

Reading a key that is not in the map is not an error: you get the **zero value** of the value
type. Added at the end of the program above, these lines print the following:

```go
	fmt.Println(stock["kale"])
	kale, ok := stock["kale"]
	fmt.Println(kale, ok)
	if n, ok := stock["leeks"]; ok {
		fmt.Println("leeks in stock:", n)
	}
```

```text
0
0 false
leeks in stock: 10
```

So `stock["kale"]` is 0 both when kale was never stocked and when its count is 0. When that
difference matters, use the **comma-ok idiom**: a second variable, by convention `ok`, is `true`
only if the key is present. It fits the `if` with a short statement from lesson 07, which keeps
`n` and `ok` inside the `if`.

## Deleting entries and looping in order

`delete(m, key)` removes one entry, and does nothing if the key is not there. `clear(m)` removes
every entry. `for key, value := range m` visits every entry, but in no particular order: the
language leaves it unspecified, and the runtime varies it on purpose so that no program comes to
depend on it.

```go
package main

import (
	"fmt"
	"maps"
	"slices"
)

func main() {
	marks := map[string]int{"ada": 7, "bo": 5, "cy": 9, "dee": 6, "eli": 8,
		"fay": 4, "gus": 7, "hal": 3, "ivy": 9, "jo": 2}
	delete(marks, "jo")
	delete(marks, "zed") // not there: does nothing
	for range 2 {
		for name, mark := range marks {
			fmt.Print(name, ":", mark, " ")
		}
		fmt.Println()
	}

	names := make([]string, 0, len(marks))
	for name := range marks {
		names = append(names, name)
	}
	slices.Sort(names)
	fmt.Println(names)
	fmt.Println(slices.Sorted(maps.Keys(marks)))
}
```

```text
bo:5 cy:9 fay:4 gus:7 ada:7 dee:6 eli:8 hal:3 ivy:9
ada:7 dee:6 eli:8 hal:3 ivy:9 bo:5 cy:9 fay:4 gus:7
[ada bo cy dee eli fay gus hal ivy]
[ada bo cy dee eli fay gus hal ivy]
```

The same loop over the same map printed two different orders, and the next run prints others.
Small maps often happen to come out in the same order, which hides the bug until the map grows.
When the order matters, for a report or a test, collect the keys into a slice, sort it with
`slices.Sort` (lesson 10) and look each key up in turn. `slices.Sorted(maps.Keys(marks))` does
the same in one line: `maps.Keys` hands out the keys one at a time as an **iterator**, and
`slices.Sorted` collects them into a sorted slice. Medium 09 explains iterators; until then, use
the line as a recipe.

## Counting and grouping

Because a missing key reads as zero, counting needs no special case: `counts[word]++` reads 0 the
first time, adds one and stores 1. The same works for slices. The zero value of a slice is `nil`,
and `append` accepts a nil slice (lesson 10), so a **map of slices** can group values under a key
without checking first:

```go
package main

import (
	"fmt"
	"strings"
)

func main() {
	counts := map[string]int{}
	for _, word := range strings.Fields("the cat saw the dog and the dog saw the cat") {
		counts[word]++
	}
	fmt.Println(counts)

	byLetter := map[byte][]string{}
	for _, fruit := range []string{"apple", "avocado", "banana", "blueberry", "cherry"} {
		byLetter[fruit[0]] = append(byLetter[fruit[0]], fruit)
	}
	fmt.Println(byLetter['b'], len(byLetter['z']))
}
```

```text
map[and:1 cat:2 dog:2 saw:2 the:4]
[banana blueberry] 0
```

`byLetter['z']` is a nil slice, so its length is 0, and reading it added nothing to the map.

## The nil map

The zero value of a map type is `nil`. A **nil map** reads like an empty one, but it has nowhere to
store entries, so writing to it panics:

```go
	var stock map[string]int
	fmt.Println(stock["leeks"], len(stock), stock == nil)
	stock["leeks"] = 10
```

```text
0 0 true
panic: assignment to entry in nil map

goroutine 1 [running]:
main.main()
	/work/main.go:8 +0x125
```

`var stock map[string]int` declares a map variable but creates no map. Create one with a literal
or `make` before the first write. A map field in a struct (lesson 12) starts out nil in the same
way.

## Which types can be keys

A map finds keys by comparing them with `==`, so the key type must be **comparable**: strings,
numbers, booleans, and arrays of comparable elements. Slices, maps and functions cannot be compared
with `==`, so they cannot be keys. `map[[]string]bool{}` fails to compile:

```text
./main.go:4:14: invalid map key type []string
```

Values have no such rule: a value may be a slice, another map, anything.

## Maps are shared, not copied

Assigning a map or passing it to a function does not copy its entries: both names refer to the
same map, so a function can change the caller's map. `maps.Copy(dst, src)` copies the entries of
one map into another. Maps cannot be compared with `==` either (only with `nil`); `maps.Equal`
compares them entry by entry.

```go
package main

import (
	"fmt"
	"maps"
)

func restock(stock map[string]int, name string, n int) {
	stock[name] += n
}

func main() {
	stock := map[string]int{"leeks": 10}
	restock(stock, "leeks", 5)
	restock(stock, "kale", 4)
	fmt.Println(stock)

	backup := map[string]int{}
	maps.Copy(backup, stock)
	backup["kale"] = 0
	fmt.Println(stock, backup, maps.Equal(stock, backup))

	clear(backup)
	fmt.Println(backup, len(backup))
}
```

```text
map[kale:4 leeks:15]
map[kale:4 leeks:15] map[kale:0 leeks:15] false
map[] 0
```

`restock` changed the caller's map, while the copy changed on its own.

## Common mistakes

- **Writing to a nil map.** `panic: assignment to entry in nil map`. Create the map with `{}` or
  `make` first.
- **Trusting the loop order.** Output that changes from run to run, and tests that pass only
  sometimes. Sort the keys.
- **Testing presence with the value.** `if stock[name] == 0` cannot tell "none left" from "never
  stocked". Use comma-ok.
- **Changing a missing key by accident.** `stock["kale"]--` on a map without kale stores
  `kale:-1`. Check with comma-ok before you subtract.
- **Comparing maps with `==`.** `invalid operation: a == b (map can only be compared to nil)`.
  Use `maps.Equal`.

## Practice

1. Count the letters of `"banana"` in a `map[rune]int` and print the counts of `'a'`, `'n'`, `'b'`
   and `'z'`.
2. With `prices := map[string]int{"tea": 250, "coffee": 300}`, use comma-ok to print
   `cocoa: not on the menu` when cocoa is missing.
3. Add cocoa at 280 and print every price in alphabetical order, one `name price` per line.
4. Group the words of `"go is a fun language to use"` by length in a `map[int][]string`.

### Answers

```go
package main

import (
	"fmt"
	"maps"
	"slices"
	"strings"
)

func main() {
	letters := map[rune]int{}
	for _, r := range "banana" {
		letters[r]++
	}
	fmt.Println(letters['a'], letters['n'], letters['b'], letters['z'])

	prices := map[string]int{"tea": 250, "coffee": 300}
	if _, ok := prices["cocoa"]; !ok {
		fmt.Println("cocoa: not on the menu")
	}

	prices["cocoa"] = 280
	for _, name := range slices.Sorted(maps.Keys(prices)) {
		fmt.Println(name, prices[name])
	}

	byLength := map[int][]string{}
	for _, word := range strings.Fields("go is a fun language to use") {
		byLength[len(word)] = append(byLength[len(word)], word)
	}
	fmt.Println(byLength[2], byLength[3], len(byLength))
}
```

```text
3 2 1 0
cocoa: not on the menu
cocoa 280
coffee 300
tea 250
[go is to] [fun use] 4
```

## Key takeaways

- `map[K]V` finds values by key; create maps with a literal or `make`, never write to a nil map.
- A missing key reads as the zero value; `v, ok := m[k]` tells you whether it was there.
- `delete` removes one entry, `clear` all of them, `len` counts them.
- Range order is unspecified and changes: sort the keys for stable output.
- Keys must be comparable; slices, maps and functions cannot be keys.
- Maps are shared when assigned or passed; `maps.Copy` and `maps.Equal` copy and compare.

## Further reading

- [The Go Programming Language Specification: Map types](https://go.dev/ref/spec#Map_types)
- [Package maps](https://pkg.go.dev/maps)
- [The Go Blog: Go maps in action](https://go.dev/blog/maps)
- [Go by Example: Maps](https://gobyexample.com/maps)
