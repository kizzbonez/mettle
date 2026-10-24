---
title: Generics
summary: Write functions and types that work for many types with type parameters and constraints, build your own constraints from type sets, use Go 1.27's generic methods within their limits, and know when an interface is the better tool.
minutes: 40
objectives:
  - Write generic functions with the constraints any, comparable and cmp.Ordered, and call them with type inference
  - Write a constraint from a union of types with ~, and read the errors for types outside it
  - Define a generic type with methods, and return the zero value of a type parameter
  - Declare a Go 1.27 generic method and explain why it cannot satisfy an interface
---

## Outline

1. Why generics
2. Type parameters and type inference
3. Constraints: any, comparable and cmp.Ordered
4. Writing a constraint: type sets and ~
5. Generic types and the zero value
6. Generic methods in Go 1.27
7. When not to use generics

## Why generics

To find a string in a `[]string` and an int in a `[]int`, you write the same loop twice. A parameter of type `any` (lesson 03) avoids the copy but loses the checks: the
compiler no longer sees that the target matches the items, and callers need type assertions to
get values back. **Generics** let one function work for many types while the compiler still
checks every call. You have used them since Basic lesson 10: `slices.Sort` and `slices.Contains`
are generic functions.

## Type parameters and type inference

```go
// Index returns the position of target in items, or -1.
func Index[T comparable](items []T, target T) int {
	for i, v := range items {
		if v == target {
			return i
		}
	}
	return -1
}

// Largest returns the largest item; items must not be empty.
func Largest[T cmp.Ordered](items []T) T {
	best := items[0]
	for _, v := range items[1:] {
		if v > best {
			best = v
		}
	}
	return best
}

func main() {
	fmt.Println(Index([]string{"oak", "ash", "elm"}, "elm"))
	fmt.Println(Index([]int{4, 8}, 5))
	fmt.Println(Largest([]float64{2.5, 9.75, 3}))
	fmt.Println(Largest([]string{"oak", "ash", "elm"}))
}
```

```text
2
-1
9.75
oak
```

`[T comparable]` is a **type parameter list**. `T` is a **type parameter**, a placeholder for a
type the caller chooses, and `comparable` is its **constraint**, the set of types allowed. Using
the function with a real type, `Index[string]`, is an **instantiation**. You rarely write the
brackets: **type inference** works `T` out from the arguments. `Index([]int{4, 8}, "x")` does not
compile: `T` is inferred as `int`, and `"x"` is not an `int`.

## Constraints: any, comparable and cmp.Ordered

A constraint is an interface, and inside the function you may only do what *every* type in its
set allows:

- `any`: all types. You can store, pass and return the values, nothing more.
- `comparable`: types that support `==` and `!=`, such as numbers, strings, pointers and structs
  of comparable fields; not slices, maps or functions. Map keys must be comparable too.
- `cmp.Ordered`, from package `cmp`: integers, floats and strings, which support `<` and `>`.

With `Index[T any]` and `Largest[T comparable]`, the compiler says:

```text
./main.go:11:6: invalid operation: v == target (incomparable types in type set)
./main.go:22:6: invalid operation: v > best (type parameter T cannot use operator >)
```

Choose the loosest constraint that allows what the body does.

## Writing a constraint: type sets and ~

To add numbers, write a constraint that lists the types. A **union** `A | B` is a set of types,
and `~int` means every type whose **underlying type** is `int`, including your own such as
`type Grams int` (Basic lesson 12):

```go
// Number is a constraint: the set of types Sum accepts.
type Number interface {
	~int | ~float64
}

// Sum adds up a slice of any number type.
func Sum[N Number](nums []N) N {
	var total N
	for _, n := range nums {
		total += n
	}
	return total
}

type Grams int

func main() {
	fmt.Println(Sum([]int{3, 4, 5}))
	fmt.Println(Sum([]float64{1.5, 2.25}))
	fmt.Println(Sum([]Grams{250, 500}))
	fmt.Println(Sum[float64]([]float64{0.1, 0.2}))
}
```

```text
12
3.75
750
0.30000000000000004
```

`+=` is allowed because every type in the set supports `+`. The result has the caller's type:
`Sum([]Grams{...})` returns `Grams`. Types outside the set are refused, and without the `~` the
error even suggests the fix:

```text
./main.go:25:17: string does not satisfy Number (string missing in ~int | ~float64)
./main.go:24:17: Grams does not satisfy Number (possibly missing ~ for int in Number)
```

Constraints with a union can only be used as constraints, not as the type of a variable.

## Generic types and the zero value

Types can have type parameters too. Methods name them again in the receiver, `(s *Stack[T])`:

```go
// Stack is a last-in, first-out pile of values of one type.
type Stack[T any] struct {
	items []T
}

func (s *Stack[T]) Push(v T) {
	s.items = append(s.items, v)
}

// Pop removes and returns the top value, or the zero value and false.
func (s *Stack[T]) Pop() (T, bool) {
	if len(s.items) == 0 {
		var zero T
		return zero, false
	}
	top := s.items[len(s.items)-1]
	s.items = s.items[:len(s.items)-1]
	return top, true
}

// in main:
var plates Stack[string]
plates.Push("blue")
plates.Push("white")
fmt.Println(plates.Pop())
fmt.Println(plates.Pop())
trays := &Stack[int]{}
fmt.Println(trays.Pop())
```

```text
white true
blue true
0 false
```

`return nil, false` would not compile (`cannot use nil as T value in return statement`): `T` may
be `int`. `var zero T` gives the zero value of whatever `T` is. A generic type must be
instantiated before use: `var t Stack` is `cannot use generic type Stack[T any] without
instantiation`. Nor can inference look at results, so for `func NewStack[T any]() *Stack[T]` you
write `NewStack[int]()`; plain `NewStack()` gives `in call to NewStack, cannot infer T`.

## Generic methods in Go 1.27

Before Go 1.27, a method could use only its receiver's type parameters. Now a method may declare
its own, which makes it a **generic method**:

```go
// Map is a generic method: it declares its own type parameter U.
func (s *Stack[T]) Map[U any](f func(T) U) []U {
	out := make([]U, 0, len(s.items))
	for _, v := range s.items {
		out = append(out, f(v))
	}
	return out
}

// in main:
trays.Push(12)
trays.Push(7)
fmt.Printf("%q\n", trays.Map(strconv.Itoa))
```

```text
["12" "7"]
```

`U` is inferred as `string` from `strconv.Itoa`. The standard library gained one too:
`(*rand.Rand).N[Int intType](n Int) Int` in `math/rand/v2` returns a random number below `n` of
any integer type, `r.N(10)` or `r.N(90 * time.Minute)`. Three limits matter:

- An interface method cannot have type parameters: `interface method must have no type
  parameters`.
- A generic method never implements an interface method, even when one instantiation would
  match. With `type Describer interface{ Map(f func(int) string) []string }`,
  `var d Describer = &Stack[int]{}` fails:

  ```text
  ./main.go:23:20: cannot use &Stack[int]{} (value of type *Stack[int]) as Describer value in variable declaration: *Stack[int] does not implement Describer (wrong type for method Map)
  		have Map[U any](func(int) U) []U
  		want Map(func(int) string) []string
  ```

- Like a generic function, it must be instantiated to become a value: `labels := trays.Map` is
  `cannot use generic function trays.Map without instantiation`; `trays.Map[string]` works.

So generic methods keep helpers with their type; behaviour that several types share still goes
in ordinary methods and interfaces.

## When not to use generics

- **Write the concrete code first.** Add a type parameter when you are about to copy a function
  only to change its types.
- **When behaviour differs per type, use an interface.** Each shape computes its area in its own
  way, so `[]Shape` with an `Area()` method is right; a type parameter adds nothing.
- **When you only call methods, take the interface.** `func show(s fmt.Stringer)` is simpler than
  `func show[T fmt.Stringer](s T)`.

## Common mistakes

- **`==` on `any`.** `incomparable types in type set`: constrain with `comparable`.
- **Forgetting `~`.** `int | float64` refuses `Grams`. Write `~int | ~float64`.
- **Expecting inference from the result.** `NewStack()` cannot infer `T`; write `NewStack[int]()`.
- **Returning `nil` for `T`.** Use `var zero T`.
- **Expecting a generic method to satisfy an interface.** It never does: give the type an
  ordinary method.

## Practice

1. Write a constraint `Weight` for `int`, `float64` and types based on them, and
   `Heaviest[W Weight](ws []W) W` for a non-empty slice.
2. Write `Count[T comparable](items []T) map[T]int` that counts each value.
3. Write `type Pair[A, B any] struct{ First A; Second B }` with a method `Swap() Pair[B, A]`.

### Answers

```go
type Weight interface {
	~int | ~float64
}

func Heaviest[W Weight](ws []W) W {
	best := ws[0]
	for _, w := range ws[1:] {
		if w > best {
			best = w
		}
	}
	return best
}

func Count[T comparable](items []T) map[T]int {
	counts := make(map[T]int)
	for _, item := range items {
		counts[item]++
	}
	return counts
}

type Pair[A, B any] struct {
	First  A
	Second B
}

func (p Pair[A, B]) Swap() Pair[B, A] {
	return Pair[B, A]{First: p.Second, Second: p.First}
}

func main() {
	fmt.Println(Heaviest([]Grams{250, 900, 400}), Heaviest([]float64{1.5, 0.5}))
	fmt.Println(Count([]string{"oak", "ash", "oak"}))
	p := Pair[string, int]{First: "oak", Second: 3}
	fmt.Printf("%+v %+v\n", p, p.Swap())
}
```

```text
900 1.5
map[ash:1 oak:2]
{First:oak Second:3} {First:3 Second:oak}
```

## Key takeaways

- `func F[T C](...)` declares a type parameter `T` with constraint `C`; inference usually supplies
  `T`, and `var zero T` is its zero value.
- `any`, `comparable` and `cmp.Ordered` cover most needs; `~int | ~float64` builds your own set.
- Go 1.27 methods may declare type parameters, but interface methods may not, and generic methods
  never satisfy interfaces.
- Same code for many types: generics. Different behaviour per type: interfaces.

## Further reading

- [The Go Programming Language Specification: Method declarations](https://go.dev/ref/spec#Method_declarations)
- [Go 1.27 release notes](https://go.dev/doc/go1.27)
- [Go blog: An Introduction To Generics](https://go.dev/blog/intro-generics)
- [Go blog: When To Use Generics](https://go.dev/blog/when-generics)
