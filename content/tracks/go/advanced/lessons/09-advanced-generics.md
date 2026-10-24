---
title: Advanced Generics
summary: Design constraints that combine type sets and methods, build generic data structures with iterators and container/heap, use Go 1.27's generic methods within their limits and Go 1.26's self-referential constraints, and choose between generics, interfaces and code generation.
minutes: 40
objectives:
  - Write a constraint that combines a type set with methods, and read the "does not satisfy" error
  - Build a generic set with an iterator and a typed priority queue on container/heap
  - Declare and call generic methods, and explain why they cannot satisfy interface methods
  - Use self-referential constraints, generic type aliases and explicit instantiation where inference stops
---

## Outline

1. Constraints that combine type sets and methods
2. A generic set with an iterator and a generic method
3. Where generic methods stop
4. A priority queue on container/heap
5. Constraints that refer to themselves
6. Generic aliases and the limits of inference
7. Generics, interfaces or code generation?

## Constraints that combine type sets and methods

A constraint can list methods next to a type set such as `~int | ~float64`. A type argument must
then be in the set *and* have the methods, and the generic code may use operators and methods:

```go
// Amount is a number type that can also print itself with its unit.
type Amount interface {
	~int | ~float64
	String() string
}

type Grams int

func (g Grams) String() string { return fmt.Sprintf("%d g", int(g)) }

// receipt adds the amounts (type set) and prints them (method).
func receipt[A Amount](amounts ...A) string {
	var total A
	parts := make([]string, len(amounts))
	for i, a := range amounts {
		total += a
		parts[i] = a.String()
	}
	return strings.Join(parts, " + ") + " = " + total.String()
}
```

```text
250 g + 125 g + 500 g = 875 g
```

That is `receipt[Grams](250, 125, 500)`. A plain `float64` is rejected where it is used:

```text
./main.go:21:19: float64 does not satisfy Amount (missing method String)
```

## A generic set with an iterator and a generic method

Generic types suit containers, whose code never depends on the element type. A set keeps its map
private and hands out an **iterator** (Medium lesson 09). Since Go 1.27 a method may also declare
**type parameters of its own** after its name: a **generic method**.

```go
// Set is a set of comparable values.
type Set[T comparable] struct {
	items map[T]struct{}
}

func NewSet[T comparable](values ...T) Set[T] {
	s := Set[T]{items: make(map[T]struct{})}
	for _, v := range values {
		s.items[v] = struct{}{}
	}
	return s
}

// All yields the members in no particular order.
func (s Set[T]) All() iter.Seq[T] { return maps.Keys(s.items) }

// Map is a generic method: it has a type parameter of its own, U.
func (s Set[T]) Map[U comparable](f func(T) U) Set[U] {
	out := NewSet[U]()
	for v := range s.All() {
		out.items[f(v)] = struct{}{}
	}
	return out
}

func main() {
	words := NewSet("bee", "wasp", "ant", "moth")
	lengths := words.Map(func(w string) int { return len(w) })
	fmt.Println(slices.Sorted(lengths.All()))
	initials := words.Map[string](func(w string) string { return w[:1] })
	fmt.Println(slices.Sorted(initials.All()))
}
```

```text
[3 4]
[a b m w]
```

`U` is inferred from the function passed in, or given explicitly as in `words.Map[string]`. Before
Go 1.27, `Map` had to be a package-level function. `math/rand/v2` has one too: `r.N(time.Minute)`
on a `*Rand` returns a random `time.Duration`.

## Where generic methods stop

An interface's methods cannot have type parameters, and a generic method never satisfies an
interface method, not even one that looks like an instance of it:

```text
./main.go:4:5: interface method must have no type parameters
./main.go:16:20: cannot use b (variable of struct type Box[int]) as Converter value in variable declaration: Box[int] does not implement Converter (wrong type for method Convert)
		have Convert[U any](func(int) U) Box[U]
		want Convert(func(int) string) Box[string]
./main.go:11:13: cannot use generic function b.Convert without instantiation
```

The first is `Map[U any](...)` in an interface; the second assigns a `Box[int]` with a generic
`Convert` to an interface wanting `Convert(func(int) string) Box[string]`; the third takes
`b.Convert` as a value. A call through an interface would need code for every possible `U`, made
at run time. Behaviour that differs by type still belongs in interfaces.

## A priority queue on container/heap

`container/heap` orders any `heap.Interface`: `sort.Interface` plus `Push(x any)` and
`Pop() any`, a pre-generics API. Wrap it once in a generic adapter behind a typed queue:

```go
// heapOf adapts a slice and a less function to heap.Interface.
type heapOf[T any] struct {
	items []T
	less  func(a, b T) bool
}

func (h *heapOf[T]) Len() int           { return len(h.items) }
func (h *heapOf[T]) Less(i, j int) bool { return h.less(h.items[i], h.items[j]) }
func (h *heapOf[T]) Swap(i, j int)      { h.items[i], h.items[j] = h.items[j], h.items[i] }
func (h *heapOf[T]) Push(x any)         { h.items = append(h.items, x.(T)) }
func (h *heapOf[T]) Pop() any {
	last := h.items[len(h.items)-1]
	h.items = h.items[:len(h.items)-1]
	return last
}

// Queue is a typed priority queue: the least item by less comes out first.
type Queue[T any] struct{ h heapOf[T] }

func NewQueue[T any](less func(a, b T) bool) *Queue[T] {
	return &Queue[T]{heapOf[T]{less: less}}
}

func (q *Queue[T]) Push(v T) { heap.Push(&q.h, v) }
func (q *Queue[T]) Len() int { return q.h.Len() }

// Pop removes and returns the least item, or false when the queue is empty.
func (q *Queue[T]) Pop() (T, bool) {
	if q.h.Len() == 0 {
		var zero T
		return zero, false
	}
	return heap.Pop(&q.h).(T), true
}
```

Pushing jobs with priorities 1, 9 and 3 (higher first), then popping:

```text
9 burst pipe
3 post
1 sweep
empty: false
```

A `less` function, rather than a required method, lets one type be queued in several orders.

## Constraints that refer to themselves

A constraint may need to mention the type itself: "a type that can compare itself with another of
its type". Go 1.26 allows a generic type in its own type parameter list, so it can say just that:

```go
// Lesser types compare themselves with values of the same type.
type Lesser[T Lesser[T]] interface {
	Less(T) bool
}

// smallest returns the least element of a non-empty slice.
func smallest[T Lesser[T]](items []T) T {
	best := items[0]
	for _, x := range items[1:] {
		if x.Less(best) {
			best = x
		}
	}
	return best
}

type Parcel struct{ Grams int }

func (p Parcel) Less(q Parcel) bool { return p.Grams < q.Grams }
```

```text
{250}
```

That is `smallest([]Parcel{{900}, {250}, {400}})`. Because `Lesser` constrains
its own parameter, a nonsense instance is caught too: `var x Lesser[int]` fails with
`int does not satisfy Lesser[int] (missing method Less)`.

## Generic aliases and the limits of inference

Since Go 1.24 an alias can have type parameters: `type Index[K comparable] = map[K][]int` is
another name for `map[K][]int`, not a new type. It mostly helps when a generic type moves to
another package and the old name must keep working.

Inference works from arguments, so for `func zero[T any]() T` the call `zero()` fails:

```text
./main.go:11:18: in call to zero, cannot infer T (declared at ./main.go:5:11)
```

Instantiate explicitly: `zero[string]()`. In the other direction, Go 1.27 infers type arguments
wherever a generic function is assigned or converted to a matching function type:

```go
func double[T int | float64](x T) T { return x * 2 }

var twice func(int) int = double // T inferred from the variable's type
steps := []func(float64) float64{double, double}
fmt.Println(twice(21), steps[1](1.25))
```

```text
42 2.5
```

## Generics, interfaces or code generation?

Use generics when the code is the same for every type: containers, `slices`-style helpers,
iterators. Use an interface when the behaviour differs per type, as `io.Reader` does for files
and sockets. Generate code (`go generate` with a tool) for what the type system cannot express,
such as one function per struct field. On speed: the compiler shares one copy of a generic
function among type arguments with the same underlying type (all pointers count as one) and
passes the rest in a hidden dictionary, so a method call on a type parameter costs about what an
interface call does.
Choose generics for type safety, not speed.

## Common mistakes

- **Over-constraining.** A `String() string` the body never uses rejects `float64` with
  `does not satisfy ... (missing method String)`. Ask for what you use.
- **Expecting a generic method to implement an interface.** It never does (`wrong type for
  method`). Give the type a concrete method for the interface.
- **Using a generic method as a value.** `b.Convert` alone is `cannot use generic function
  b.Convert without instantiation`; write `b.Convert[string]`.
- **Leaving `container/heap`'s `any` in your API.** Wrap it once in a typed queue.

## Practice

1. Add `Filter(keep func(T) bool) Set[T]` to `Set`. Does it need a type parameter of its own?
2. Write a constraint `Weighed` for integer types that also have a method `Label() string`.
3. Why can `smallest` not be called on `[]int`?

### Answers

```go
// 1. No: Filter keeps the element type, so it is an ordinary method.
func (s Set[T]) Filter(keep func(T) bool) Set[T] {
	out := NewSet[T]()
	for v := range s.All() {
		if keep(v) {
			out.items[v] = struct{}{}
		}
	}
	return out
}

// 2.
type Weighed interface {
	~int | ~int8 | ~int16 | ~int32 | ~int64
	Label() string
}
```

Filtering the four words for length 4 and sorting gives `[moth wasp]`. For question 3: `int` has
no `Less` method, so it does not satisfy `Lesser[int]`; use `slices.Min`.

## Key takeaways

- A constraint may combine a type set (for operators) with methods; ask only for what you use.
- Generic methods (Go 1.27) take their own type parameters, but cannot be or satisfy interface
  methods, and must be instantiated before use as values.
- `type Lesser[T Lesser[T]]` (Go 1.26) constrains a type by its relation to itself.
- Generics for the same code on many types, interfaces for different behaviour.

## Further reading

- [The Go Programming Language Specification: Method declarations](https://go.dev/ref/spec#Method_declarations)
- [Go 1.27 release notes](https://go.dev/doc/go1.27)
- [The Go Blog: When To Use Generics](https://go.dev/blog/when-generics)
- [Package container/heap](https://pkg.go.dev/container/heap)
