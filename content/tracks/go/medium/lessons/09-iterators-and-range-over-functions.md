---
title: Iterators and range over Functions
summary: Range over functions with iter.Seq and iter.Seq2, write iterators that stop when the loop breaks, use the iterators of slices, maps and strings, chain your own adapters, pull values with iter.Pull, and choose between an iterator and a slice.
minutes: 35
objectives:
  - Write an iter.Seq or iter.Seq2 iterator that honours yield's false result
  - Use slices.All, Values and Backward, maps.Keys and Values, and strings.Lines, SplitSeq and FieldsSeq
  - Collect iterators with slices.Collect and slices.Sorted, and chain Filter and Map adapters
  - Walk two sequences together with iter.Pull and always call stop
---

## Outline

1. A function you can range over
2. Honouring yield's result
3. Iterators in the standard library
4. Chaining adapters
5. Pull iterators
6. When iterators beat slices

## A function you can range over

A type that stores values privately, such as a playlist, must still let callers loop over them.
A copy in a slice costs memory; an exported field gives the storage away. Since Go 1.23,
`for range` can loop over a **function**. Package `iter` names the two shapes it accepts:

```go
type Seq[V any] func(yield func(V) bool)
type Seq2[K, V any] func(yield func(K, V) bool)
```

An **iterator** is a function of one of these types. It calls `yield` once for each value, and
the body of your `for` loop becomes that `yield` function:

```go
// Countdown yields from, from-1, ... down to 1.
func Countdown(from int) iter.Seq[int] {
	return func(yield func(int) bool) {
		for i := from; i >= 1; i-- {
			if !yield(i) {
				return // the loop body said stop
			}
		}
	}
}

// All yields each song with its track number, starting at 1.
func (p Playlist) All() iter.Seq2[int, string] {
	return func(yield func(int, string) bool) {
		for i, s := range p.songs {
			if !yield(i+1, s) {
				return
			}
		}
	}
}

func main() {
	for n := range Countdown(3) {
		fmt.Print(n, " ")
	}
	fmt.Println("lift-off")

	p := Playlist{songs: []string{"Intro", "Rain", "Coda"}}
	for track, song := range p.All() {
		if song == "Coda" {
			break
		}
		fmt.Println(track, song)
	}
}
```

```text
3 2 1 lift-off
1 Intro
2 Rain
```

`Seq` gives one loop variable, `Seq2` two, like a slice's index and value. By convention a
collection's main iterator is a method named `All`; other names say what they walk, such as
`Backward` or `Keys`. Writing the iterator as a function that *returns* an `iter.Seq` lets it take
parameters, like `from`.

## Honouring yield's result

`yield` returns false when the loop body ends the loop early, with `break` or with a `return` from
the enclosing function. The iterator must then stop calling `yield` and return. (A panic in the
body does not return from `yield` at all: it passes up through the iterator, running its deferred
calls.) If the iterator ignores the result, the program crashes:

```go
// Careless ignores yield's result.
func Careless(n int) iter.Seq[int] {
	return func(yield func(int) bool) {
		for i := range n {
			yield(i)
		}
	}
}

func main() {
	for v := range Careless(5) {
		fmt.Println(v)
		if v == 1 {
			break
		}
	}
}
```

```text
0
1
panic: runtime error: range function continued iteration after function for loop body returned false
```

(The stack trace is cut here.) Neither the compiler nor `go vet` catches this, so make
`if !yield(v) { return }` a habit, and test every iterator with a loop that breaks.

## Iterators in the standard library

Package `slices` has `All` (index and value), `Values` and `Backward`; package `maps` has `All`,
`Keys` and `Values`. Go 1.24 added `strings.Lines`, `SplitSeq` and `FieldsSeq`, which work like
`Split` and `Fields` without building a slice. To get a slice back, `slices.Collect` gathers the
values in order and `slices.Sorted` gathers and sorts them:

```go
songs := []string{"Intro", "Rain", "Coda"}
for i, s := range slices.Backward(songs) {
	fmt.Print(i, ":", s, " ")
}
fmt.Println()

plays := map[string]int{"Rain": 12, "Intro": 3, "Coda": 7}
fmt.Println(slices.Sorted(maps.Keys(plays)))
fmt.Println(slices.Collect(slices.Values(songs)))

text := "Rain 4:05\nCoda 2:51\n"
for line := range strings.Lines(text) {
	fmt.Printf("%q\n", line)
}
for part := range strings.SplitSeq("a,b,,c", ",") {
	fmt.Printf("%q ", part)
}
fmt.Println()
for word := range strings.FieldsSeq("  Rain   4:05 ") {
	fmt.Printf("%q ", word)
}
fmt.Println()
```

```text
2:Coda 1:Rain 0:Intro 
[Coda Intro Rain]
[Intro Rain Coda]
"Rain 4:05\n"
"Coda 2:51\n"
"a" "b" "" "c" 
"Rain" "4:05" 
```

`strings.Lines` keeps each line's `\n`; trim it when you need the text alone. This is the
`slices.Sorted(maps.Keys(m))` you met in Basic lesson 11 and lesson 08, now explained: `maps.Keys`
returns an `iter.Seq[string]`, and `slices.Sorted` consumes it.

## Chaining adapters

An **adapter** takes an iterator and returns a new one. With generics (lesson 07) you write each
adapter once for every element type:

```go
// Filter yields the values of seq for which keep returns true.
func Filter[V any](seq iter.Seq[V], keep func(V) bool) iter.Seq[V] {
	return func(yield func(V) bool) {
		for v := range seq {
			if keep(v) && !yield(v) {
				return
			}
		}
	}
}

// Map yields f of each value of seq.
func Map[V, W any](seq iter.Seq[V], f func(V) W) iter.Seq[W] {
	return func(yield func(W) bool) {
		for v := range seq {
			if !yield(f(v)) {
				return
			}
		}
	}
}

// in main; Naturals yields 1, 2, 3 and so on, for ever.
odd := Filter(Naturals(), func(n int) bool { return n%2 == 1 })
squares := Map(odd, func(n int) int { return n * n })
for sq := range squares {
	if sq > 50 {
		break
	}
	fmt.Print(sq, " ")
}
fmt.Println()

songs := []string{"Intro", "Rain", "Coda", "Reprise"}
loud := Map(Filter(slices.Values(songs), func(s string) bool {
	return strings.HasPrefix(s, "R")
}), strings.ToUpper)
fmt.Println(slices.Collect(loud))
```

```text
1 9 25 49 
[RAIN REPRISE]
```

`Naturals` never ends, yet the program does: nothing runs until the `for` asks for a value, each
value travels through the whole chain on its own, and the `break` makes every `yield` in the
chain return false. Building the chain does no work; that is what **lazy** means.

## Pull iterators

`range` *pushes* values into your loop body. To walk two sequences side by side you need to
*pull* one value at a time from each. `iter.Pull` turns a `Seq` into a `next` function, which
returns a value and whether there was one, and a `stop` function:

```go
names := slices.Values([]string{"Ada", "Ben", "Kim"})
times := slices.Values([]int{1302, 1302, 1450, 1500})

nextName, stopNames := iter.Pull(names)
defer stopNames()
nextTime, stopTimes := iter.Pull(times)
defer stopTimes()

for {
	name, ok1 := nextName()
	secs, ok2 := nextTime()
	if !ok1 || !ok2 {
		break
	}
	fmt.Println(name, secs)
}
```

```text
Ada 1302
Ben 1302
Kim 1450
```

The loop stops while `times` still has 1500 left. `stop` makes that iterator's `yield` return
false so it can finish and run its own cleanup; without it, the paused iterator is never
finished. Calling `stop` twice, or after the end, is allowed, so `defer stop()` straight after
`iter.Pull` is the safe habit.

## When iterators beat slices

Use an iterator when the values are many or endless, when callers often stop early, when they
come from a stream such as lines of input, or when you only want to hide how a type stores its
data. Return a slice when callers need its length, indexing, sorting or several passes: a plain
slice is simpler. The Go team's own advice is that in many cases a loop is clearer than a chain
of adapters.

## Common mistakes

- **Ignoring `yield`'s result.** `range function continued iteration after function for loop body
  returned false`. Return as soon as `yield` returns false.
- **Forgetting `stop`.** A pulled iterator that you abandon is never finished. `defer stop()`.
- **Expecting `strings.Lines` to drop the newline.** It yields `"Rain 4:05\n"`; use
  `strings.TrimSuffix` or `strings.TrimSpace` if needed.
- **Building a slice only to loop over it.** `for _, w := range strings.Fields(text)` allocates a
  slice; `strings.FieldsSeq(text)` does not.

## Practice

1. Write `Evens(limit int) iter.Seq[int]` that yields 0, 2, 4 and so on below `limit`.
2. Write `Take[V any](seq iter.Seq[V], n int) iter.Seq[V]` that yields at most the first `n`
   values, and use it on `Evens(100)`.
3. Count the words of a text with `strings.FieldsSeq`, without building a slice.

### Answers

```go
func Evens(limit int) iter.Seq[int] {
	return func(yield func(int) bool) {
		for n := 0; n < limit; n += 2 {
			if !yield(n) {
				return
			}
		}
	}
}

func Take[V any](seq iter.Seq[V], n int) iter.Seq[V] {
	return func(yield func(V) bool) {
		if n <= 0 {
			return
		}
		count := 0
		for v := range seq {
			if !yield(v) {
				return
			}
			count++
			if count == n {
				return
			}
		}
	}
}

func countWords(text string) int {
	n := 0
	for range strings.FieldsSeq(text) {
		n++
	}
	return n
}

func main() {
	for n := range Evens(7) {
		fmt.Print(n, " ")
	}
	fmt.Println()
	for n := range Take(Evens(100), 3) {
		fmt.Print(n, " ")
	}
	fmt.Println()
	fmt.Println(countWords("  the rain  in Spain "))
}
```

```text
0 2 4 6 
0 2 4 
4
```

`Take` returns right after the `n`th value, so its source is never asked for one more.

## Key takeaways

- `iter.Seq[V]` is `func(yield func(V) bool)`; `for range` calls it with the loop body as `yield`.
- Stop as soon as `yield` returns false, or the program panics.
- `slices`, `maps` and `strings` offer iterators; `slices.Collect` and `slices.Sorted` turn them
  into slices.
- Adapters chain lazily; `iter.Pull` walks sequences side by side, with `defer stop()`. Prefer a
  slice when callers need length, indexing or several passes.

## Further reading

- [Package iter](https://pkg.go.dev/iter)
- [Go blog: Range Over Function Types](https://go.dev/blog/range-functions)
- [Go by Example: Range over Iterators](https://gobyexample.com/range-over-iterators)
